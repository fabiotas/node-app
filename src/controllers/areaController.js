const Area = require('../models/Area');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

// @desc    Obter todas as areas (publico)
// @route   GET /api/areas
// @access  Public
exports.getAllAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, active } = req.query;
    
    let query = {};
    
    // Filtro por status ativo (por padrao, apenas areas ativas para publico)
    if (active !== undefined) {
      query.active = active === 'true';
    } else {
      query.active = true;
    }

    // Busca por texto
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const areas = await Area.find(query)
      .populate('owner', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Area.countDocuments(query);

    res.json({
      success: true,
      count: areas.length,
      data: areas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar areas',
      error: error.message
    });
  }
};

// @desc    Obter areas do usuario logado
// @route   GET /api/areas/my
// @access  Private
exports.getMyAreas = async (req, res) => {
  try {
    const areas = await Area.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: areas.length,
      data: areas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar suas areas',
      error: error.message
    });
  }
};

// @desc    Obter area por ID
// @route   GET /api/areas/:id
// @access  Public
exports.getAreaById = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id)
      .populate('owner', 'name email');
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    res.json({ success: true, data: area });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID de area invalido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar area',
      error: error.message
    });
  }
};

// @desc    Criar nova area
// @route   POST /api/areas
// @access  Private
exports.createArea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    const { name, description, address, pricePerDay, maxGuests, amenities, images } = req.body;

    const area = await Area.create({
      name,
      description,
      address,
      pricePerDay,
      maxGuests,
      amenities: amenities || [],
      images: images || [],
      owner: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Area criada com sucesso',
      data: area
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar area',
      error: error.message
    });
  }
};

// @desc    Atualizar area
// @route   PUT /api/areas/:id
// @access  Private (apenas dono)
exports.updateArea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erros de validacao',
        errors: errors.array()
      });
    }

    let area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    // Verifica se o usuario e o dono da area
    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para editar esta area'
      });
    }

    const { name, description, address, pricePerDay, maxGuests, amenities, images, active } = req.body;

    if (name) area.name = name;
    if (description) area.description = description;
    if (address) area.address = address;
    if (pricePerDay !== undefined) area.pricePerDay = pricePerDay;
    if (maxGuests !== undefined) area.maxGuests = maxGuests;
    if (amenities) area.amenities = amenities;
    if (images) area.images = images;
    if (typeof active === 'boolean') area.active = active;

    await area.save();

    res.json({
      success: true,
      message: 'Area atualizada com sucesso',
      data: area
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID de area invalido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar area',
      error: error.message
    });
  }
};

// @desc    Deletar area
// @route   DELETE /api/areas/:id
// @access  Private (apenas dono ou admin)
exports.deleteArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    // Verifica se o usuario e o dono da area ou admin
    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para deletar esta area'
      });
    }

    // Verifica se existem reservas pendentes ou confirmadas
    const activeBookings = await Booking.countDocuments({
      area: area._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nao e possivel deletar uma area com reservas ativas'
      });
    }

    await Area.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Area deletada com sucesso'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID de area invalido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar area',
      error: error.message
    });
  }
};

// @desc    Verificar disponibilidade de uma area
// @route   GET /api/areas/:id/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Datas de check-in e check-out sao obrigatorias'
      });
    }

    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    const hasConflict = await Booking.hasConflict(
      req.params.id,
      new Date(checkIn),
      new Date(checkOut)
    );

    res.json({
      success: true,
      data: {
        available: !hasConflict,
        area: area._id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar disponibilidade',
      error: error.message
    });
  }
};

