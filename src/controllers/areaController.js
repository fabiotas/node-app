const Area = require('../models/Area');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const { validateSpecialPrice } = require('../middlewares/validators');

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

    const { name, description, address, pricePerDay, maxGuests, amenities, images, specialPrices } = req.body;

    // Validar preços especiais se fornecidos
    if (specialPrices && Array.isArray(specialPrices)) {
      for (const price of specialPrices) {
        const validationError = validateSpecialPrice(price);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: `Erro de validação no preço especial: ${validationError}`
          });
        }
      }
    }

    const area = await Area.create({
      name,
      description,
      address,
      pricePerDay,
      maxGuests,
      amenities: amenities || [],
      images: images || [],
      specialPrices: specialPrices || [],
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

    const { name, description, address, pricePerDay, maxGuests, amenities, images, active, specialPrices } = req.body;

    if (name) area.name = name;
    if (description) area.description = description;
    if (address) area.address = address;
    if (pricePerDay !== undefined) area.pricePerDay = pricePerDay;
    if (maxGuests !== undefined) area.maxGuests = maxGuests;
    if (amenities) area.amenities = amenities;
    if (images) area.images = images;
    if (typeof active === 'boolean') area.active = active;
    
    // Processar specialPrices se fornecido
    if (specialPrices !== undefined) {
      if (!Array.isArray(specialPrices)) {
        return res.status(400).json({
          success: false,
          message: 'specialPrices deve ser um array'
        });
      }

      // Validar todos os preços especiais
      for (const price of specialPrices) {
        const validationError = validateSpecialPrice(price);
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: `Erro de validação no preço especial: ${validationError}`
          });
        }
      }

      area.specialPrices = specialPrices;
    }

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

// @desc    Obter todos os preços especiais de uma área
// @route   GET /api/areas/:areaId/special-prices
// @access  Private (dono da área)
exports.getSpecialPrices = async (req, res) => {
  try {
    const { areaId } = req.params;

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
        message: 'Voce nao tem permissao para acessar esta area'
      });
    }

    const specialPrices = area.specialPrices || [];

    res.json({
      success: true,
      count: specialPrices.length,
      data: specialPrices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar precos especiais',
      error: error.message
    });
  }
};

// @desc    Criar um novo preço especial
// @route   POST /api/areas/:areaId/special-prices
// @access  Private (dono da área)
exports.createSpecialPrice = async (req, res) => {
  try {
    const { areaId } = req.params;
    const specialPriceData = req.body;

    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para modificar esta area'
      });
    }

    // Validações
    const validationError = validateSpecialPrice(specialPriceData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Inicializar array se não existir
    if (!area.specialPrices) {
      area.specialPrices = [];
    }

    // Adicionar preço especial
    area.specialPrices.push(specialPriceData);
    await area.save();

    // Retornar o último preço adicionado
    const newPrice = area.specialPrices[area.specialPrices.length - 1];

    res.status(201).json({
      success: true,
      message: 'Preco especial criado com sucesso',
      data: newPrice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar preco especial',
      error: error.message
    });
  }
};

// @desc    Atualizar um preço especial específico
// @route   PUT /api/areas/:areaId/special-prices/:priceId
// @access  Private (dono da área)
exports.updateSpecialPrice = async (req, res) => {
  try {
    const { areaId, priceId } = req.params;
    const updateData = req.body;

    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para modificar esta area'
      });
    }

    // Encontrar o preço especial
    const priceIndex = area.specialPrices.findIndex(
      sp => sp._id.toString() === priceId
    );

    if (priceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Preco especial nao encontrado'
      });
    }

    const existingPrice = area.specialPrices[priceIndex].toObject();

    // Verificar se está tentando alterar data retroativa
    if (existingPrice.type === 'date_range' && existingPrice.endDate) {
      const endDate = new Date(existingPrice.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (endDate < today) {
        // Se o período já passou, não permite alterar datas
        if (updateData.startDate || updateData.endDate) {
          return res.status(400).json({
            success: false,
            message: 'Nao e possivel alterar datas de periodos que ja passaram'
          });
        }
      }
    }

    // Mesclar dados atualizados
    const updatedPrice = {
      ...existingPrice,
      ...updateData
    };

    // Validações
    const validationError = validateSpecialPrice(updatedPrice);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Atualizar preço especial
    Object.assign(area.specialPrices[priceIndex], updateData);
    await area.save();

    res.json({
      success: true,
      message: 'Preco especial atualizado com sucesso',
      data: area.specialPrices[priceIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preco especial',
      error: error.message
    });
  }
};

// @desc    Excluir um preço especial
// @route   DELETE /api/areas/:areaId/special-prices/:priceId
// @access  Private (dono da área)
exports.deleteSpecialPrice = async (req, res) => {
  try {
    const { areaId, priceId } = req.params;

    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area nao encontrada'
      });
    }

    if (area.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Voce nao tem permissao para modificar esta area'
      });
    }

    // Encontrar e remover o preço especial
    const priceIndex = area.specialPrices.findIndex(
      sp => sp._id.toString() === priceId
    );

    if (priceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Preco especial nao encontrado'
      });
    }

    area.specialPrices.splice(priceIndex, 1);
    await area.save();

    res.json({
      success: true,
      message: 'Preco especial excluido com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir preco especial',
      error: error.message
    });
  }
};
