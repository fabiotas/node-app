const Booking = require('../models/Booking');
const Area = require('../models/Area');
const { validationResult } = require('express-validator');

// @desc    Obter minhas reservas (como hospede)
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('area', 'name address pricePerDay images')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar suas reservas',
      error: error.message
    });
  }
};

// @desc    Obter reservas das minhas areas (como proprietario)
// @route   GET /api/bookings/owner
// @access  Private
exports.getBookingsForMyAreas = async (req, res) => {
  try {
    // Primeiro, obter todas as areas do usuario
    const myAreas = await Area.find({ owner: req.user._id }).select('_id');
    const areaIds = myAreas.map(area => area._id);

    // Buscar reservas dessas areas
    const bookings = await Booking.find({ area: { $in: areaIds } })
      .populate('area', 'name address pricePerDay images')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reservas das suas areas',
      error: error.message
    });
  }
};

// @desc    Obter reservas de uma area especifica
// @route   GET /api/bookings/area/:areaId
// @access  Private (dono da area)
exports.getBookingsByArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.areaId);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    // Verificar se e o dono da area ou admin
    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para ver as reservas desta area'
      });
    }

    const bookings = await Booking.find({ area: req.params.areaId })
      .populate('guest', 'name email')
      .sort({ checkIn: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reservas da area',
      error: error.message
    });
  }
};

// @desc    Obter reserva por ID
// @route   GET /api/bookings/:id
// @access  Private (hospede ou dono da area)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('area', 'name address pricePerDay images owner')
      .populate('guest', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva nao encontrada'
      });
    }

    // Verificar se e o hospede, dono da area ou admin
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isOwner = booking.area.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isGuest && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para ver esta reserva'
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID de reserva invalido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reserva',
      error: error.message
    });
  }
};

// @desc    Criar nova reserva
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { areaId, checkIn, checkOut, guests } = req.body;

    // Verificar se a area existe e esta ativa
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    if (!area.active) {
      return res.status(400).json({
        success: false,
        message: 'Esta area nao esta disponivel para reservas'
      });
    }

    // Nao permitir reservar propria area
    if (area.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Voce nao pode reservar sua propria area'
      });
    }

    // Verificar numero de hospedes
    if (guests > area.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Esta area suporta no maximo ${area.maxGuests} hospedes`
      });
    }

    // Verificar disponibilidade
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Verificar se datas sao validas
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de check-out deve ser posterior ao check-in'
      });
    }

    // Verificar se check-in nao e no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Data de check-in nao pode ser no passado'
      });
    }

    // Verificar conflitos de datas
    const hasConflict = await Booking.hasConflict(areaId, checkInDate, checkOutDate);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Esta area ja esta reservada para as datas selecionadas'
      });
    }

    // Calcular preco total considerando preços especiais
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Função para obter o preço de uma data específica
    const getPriceForDate = (date) => {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = date.getDay(); // 0-6
      const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // MM-DD
      
      // Buscar preços especiais ativos
      const activeSpecialPrices = (area.specialPrices || []).filter(sp => sp.active !== false);
      
      // Prioridade: date_range (isPackage) > date_range > holiday > day_of_week > preço padrão
      
      // 1. Verificar pacotes (date_range com isPackage = true)
      const packagePrice = activeSpecialPrices.find(sp => 
        sp.type === 'date_range' && 
        sp.isPackage === true &&
        dateStr >= sp.startDate && 
        dateStr <= sp.endDate
      );
      if (packagePrice) {
        // Se for pacote, retornar o preço do pacote dividido pelo número de dias do pacote
        const packageStart = new Date(packagePrice.startDate);
        const packageEnd = new Date(packagePrice.endDate);
        const packageDays = Math.ceil((packageEnd - packageStart) / (1000 * 60 * 60 * 24)) + 1;
        return packagePrice.price / packageDays;
      }
      
      // 2. Verificar períodos especiais (date_range sem isPackage)
      const dateRangePrice = activeSpecialPrices.find(sp => 
        sp.type === 'date_range' && 
        sp.isPackage !== true &&
        dateStr >= sp.startDate && 
        dateStr <= sp.endDate
      );
      if (dateRangePrice) {
        return dateRangePrice.price;
      }
      
      // 3. Verificar feriados
      const holidayPrice = activeSpecialPrices.find(sp => 
        sp.type === 'holiday' && 
        sp.holidayDate === monthDay
      );
      if (holidayPrice) {
        return holidayPrice.price;
      }
      
      // 4. Verificar dias da semana
      const dayOfWeekPrice = activeSpecialPrices.find(sp => 
        sp.type === 'day_of_week' && 
        sp.daysOfWeek && 
        sp.daysOfWeek.includes(dayOfWeek)
      );
      if (dayOfWeekPrice) {
        return dayOfWeekPrice.price;
      }
      
      // 5. Preço padrão
      return area.pricePerDay;
    };
    
    // Calcular preço total dia a dia
    let totalPrice = 0;
    const currentDate = new Date(checkInDate);
    
    while (currentDate < checkOutDate) {
      totalPrice += getPriceForDate(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const booking = await Booking.create({
      area: areaId,
      guest: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      guests,
      status: 'pending'
    });

    // Popular dados para resposta
    await booking.populate('area', 'name address pricePerDay');
    await booking.populate('guest', 'name email');

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva',
      error: error.message
    });
  }
};

// @desc    Atualizar status da reserva
// @route   PATCH /api/bookings/:id/status
// @access  Private (dono da area ou admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('area', 'owner');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva nao encontrada'
      });
    }

    // Verificar se e o dono da area ou admin
    const isOwner = booking.area.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para atualizar esta reserva'
      });
    }

    // Validar transicoes de status
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled', 'completed'],
      cancelled: [],
      completed: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Nao e possivel mudar status de "${booking.status}" para "${status}"`
      });
    }

    booking.status = status;
    await booking.save();

    await booking.populate('area', 'name address pricePerDay');
    await booking.populate('guest', 'name email');

    res.json({
      success: true,
      message: 'Status da reserva atualizado com sucesso',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da reserva',
      error: error.message
    });
  }
};

// @desc    Cancelar reserva (pelo hospede)
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (hospede)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva nao encontrada'
      });
    }

    // Verificar se e o hospede
    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para cancelar esta reserva'
      });
    }

    // Apenas reservas pendentes ou confirmadas podem ser canceladas
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva nao pode ser cancelada'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    await booking.populate('area', 'name address pricePerDay');
    await booking.populate('guest', 'name email');

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar reserva',
      error: error.message
    });
  }
};

