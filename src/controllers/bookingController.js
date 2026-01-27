const Booking = require('../models/Booking');
const Area = require('../models/Area');
const Guest = require('../models/Guest');
const { validationResult } = require('express-validator');
const { populateGuest, populateGuests } = require('../utils/bookingUtils');

// @desc    Obter minhas reservas (como hospede)
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id, guestModel: 'User' })
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
      .sort({ createdAt: -1 });

    // Popular guest dinamicamente
    await populateGuests(bookings);

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
      .sort({ checkIn: -1 });

    // Popular guest dinamicamente
    await populateGuests(bookings);

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
      .populate('area', 'name address pricePerDay images owner');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva nao encontrada'
      });
    }

    // Popular guest dinamicamente
    await populateGuest(booking);

    // Verificar se e o hospede, dono da area ou admin
    // Para Guest, não há como ser o usuário logado, então apenas verificar se é dono ou admin
    const isGuest = booking.guestModel === 'User' && booking.guest._id.toString() === req.user._id.toString();
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
      guestModel: 'User',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      guests,
      status: 'pending'
    });

    // Popular dados para resposta
    await booking.populate('area', 'name address pricePerDay');
    await populateGuest(booking);

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
    await populateGuest(booking);

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

    // Verificar se e o hospede (apenas para User, Guest não pode cancelar)
    if (booking.guestModel !== 'User' || booking.guest.toString() !== req.user._id.toString()) {
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
    await populateGuest(booking);

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

// @desc    Criar reserva externa (dono da área cadastra reserva feita fora do site)
// @route   POST /api/bookings/external
// @access  Private (dono da área)
exports.createExternalBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { areaId, checkIn, checkOut, guests, guest, totalPrice, status } = req.body;

    // Verificar se a area existe
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    // Verificar se o usuário é o dono da área
    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para cadastrar reservas nesta area'
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

    // Verificar conflitos de datas (opcional para reservas externas, mas recomendado)
    const hasConflict = await Booking.hasConflict(areaId, checkInDate, checkOutDate);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Esta area ja esta reservada para as datas selecionadas'
      });
    }

    // Criar ou buscar pré-usuário (Guest)
    let guestDoc;
    
    // Normalizar CPF (remover caracteres não numéricos)
    const normalizedCpf = guest.cpf ? guest.cpf.replace(/\D/g, '') : null;
    
    // Tentar encontrar guest existente por CPF ou celular
    if (normalizedCpf) {
      guestDoc = await Guest.findOne({ cpf: normalizedCpf });
    }
    
    if (!guestDoc) {
      // Buscar por celular se não encontrou por CPF
      guestDoc = await Guest.findOne({ phone: guest.phone });
    }

    if (!guestDoc) {
      // Criar novo guest
      guestDoc = await Guest.create({
        name: guest.name,
        phone: guest.phone,
        cpf: normalizedCpf || undefined,
        birthDate: guest.birthDate ? new Date(guest.birthDate) : undefined
      });
    } else {
      // Atualizar informações do guest existente se necessário
      let updated = false;
      if (guest.name && guestDoc.name !== guest.name) {
        guestDoc.name = guest.name;
        updated = true;
      }
      if (guest.phone && guestDoc.phone !== guest.phone) {
        guestDoc.phone = guest.phone;
        updated = true;
      }
      if (normalizedCpf && !guestDoc.cpf) {
        guestDoc.cpf = normalizedCpf;
        updated = true;
      }
      if (guest.birthDate && !guestDoc.birthDate) {
        guestDoc.birthDate = new Date(guest.birthDate);
        updated = true;
      }
      if (updated) {
        await guestDoc.save();
      }
    }

    // Calcular preço total se não fornecido
    let calculatedTotalPrice = totalPrice;
    
    if (!calculatedTotalPrice) {
      // Função para obter o preço de uma data específica (mesma lógica do createBooking)
      const getPriceForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const activeSpecialPrices = (area.specialPrices || []).filter(sp => sp.active !== false);
        
        // 1. Verificar pacotes
        const packagePrice = activeSpecialPrices.find(sp => 
          sp.type === 'date_range' && 
          sp.isPackage === true &&
          dateStr >= sp.startDate && 
          dateStr <= sp.endDate
        );
        if (packagePrice) {
          const packageStart = new Date(packagePrice.startDate);
          const packageEnd = new Date(packagePrice.endDate);
          const packageDays = Math.ceil((packageEnd - packageStart) / (1000 * 60 * 60 * 24)) + 1;
          return packagePrice.price / packageDays;
        }
        
        // 2. Verificar períodos especiais
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
      calculatedTotalPrice = 0;
      const currentDate = new Date(checkInDate);
      
      while (currentDate < checkOutDate) {
        calculatedTotalPrice += getPriceForDate(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Criar reserva com guest
    const booking = await Booking.create({
      area: areaId,
      guest: guestDoc._id,
      guestModel: 'Guest',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: calculatedTotalPrice,
      guests,
      status: status || 'confirmed' // Reservas externas geralmente vêm confirmadas
    });

    // Popular dados para resposta
    await booking.populate('area', 'name address pricePerDay');
    await populateGuest(booking);

    res.status(201).json({
      success: true,
      message: 'Reserva externa criada com sucesso',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva externa',
      error: error.message
    });
  }
};
