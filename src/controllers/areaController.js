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

    const { name, description, address, bairro, nomeCidade, whatsapp, showWhatsapp, pricePerDay, maxGuests, amenities, images, specialPrices, shareImageIndex, faqs } = req.body;

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

    // Validar FAQs se fornecidos
    if (faqs && Array.isArray(faqs)) {
      for (const faq of faqs) {
        if (!faq.question || !faq.answer) {
          return res.status(400).json({
            success: false,
            message: 'Cada FAQ deve ter question e answer'
          });
        }
        if (faq.question.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Pergunta deve ter no maximo 500 caracteres'
          });
        }
        if (faq.answer.length > 2000) {
          return res.status(400).json({
            success: false,
            message: 'Resposta deve ter no maximo 2000 caracteres'
          });
        }
      }
    }

    // Validar shareImageIndex se fornecido
    const imageArray = images || [];
    let validShareImageIndex = shareImageIndex !== undefined ? shareImageIndex : 0;
    
    if (validShareImageIndex < 0 || (imageArray.length > 0 && validShareImageIndex >= imageArray.length)) {
      return res.status(400).json({
        success: false,
        message: 'shareImageIndex deve ser um índice válido do array images'
      });
    }

    // Se não houver imagens, shareImageIndex deve ser 0 ou undefined
    if (imageArray.length === 0) {
      validShareImageIndex = 0;
    }

    const area = await Area.create({
      name,
      description,
      address,
      bairro,
      nomeCidade,
      whatsapp,
      showWhatsapp: showWhatsapp || false,
      pricePerDay,
      maxGuests,
      amenities: amenities || [],
      images: imageArray,
      shareImageIndex: validShareImageIndex,
      specialPrices: specialPrices || [],
      faqs: faqs || [],
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

    const { name, description, address, bairro, nomeCidade, whatsapp, showWhatsapp, pricePerDay, maxGuests, amenities, images, active, specialPrices, shareImageIndex, faqs } = req.body;

    // Debug: verificar o que está sendo recebido
    console.log('Dados recebidos:', { bairro, nomeCidade, whatsapp, showWhatsapp, faqs });

    if (name !== undefined) area.name = name;
    if (description !== undefined) area.description = description;
    if (address !== undefined) area.address = address;
    if (bairro !== undefined) {
      area.bairro = bairro === '' ? null : bairro;
    }
    if (nomeCidade !== undefined) {
      area.nomeCidade = nomeCidade === '' ? null : nomeCidade;
    }
    if (whatsapp !== undefined) {
      area.whatsapp = whatsapp === '' ? null : whatsapp;
    }
    if (typeof showWhatsapp === 'boolean') area.showWhatsapp = showWhatsapp;
    if (pricePerDay !== undefined) area.pricePerDay = pricePerDay;
    if (maxGuests !== undefined) area.maxGuests = maxGuests;
    if (amenities) area.amenities = amenities;
    if (images) {
      area.images = images;
      
      // Validar shareImageIndex se fornecido
      if (shareImageIndex !== undefined) {
        if (shareImageIndex < 0 || (images.length > 0 && shareImageIndex >= images.length)) {
          return res.status(400).json({
            success: false,
            message: 'shareImageIndex deve ser um índice válido do array images'
          });
        }
        area.shareImageIndex = shareImageIndex;
      } else if (images.length > 0 && area.shareImageIndex >= images.length) {
        // Se o índice atual não for mais válido após atualizar as imagens, resetar para 0
        area.shareImageIndex = 0;
      }
    } else if (shareImageIndex !== undefined) {
      // Se apenas shareImageIndex foi fornecido, validar contra o array atual
      const currentImages = area.images || [];
      if (shareImageIndex < 0 || (currentImages.length > 0 && shareImageIndex >= currentImages.length)) {
        return res.status(400).json({
          success: false,
          message: 'shareImageIndex deve ser um índice válido do array images'
        });
      }
      area.shareImageIndex = shareImageIndex;
    }
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
      area.markModified('specialPrices'); // Marcar como modificado para garantir que seja salvo
    }

    // Processar FAQs se fornecido
    if (faqs !== undefined) {
      if (!Array.isArray(faqs)) {
        return res.status(400).json({
          success: false,
          message: 'faqs deve ser um array'
        });
      }

      // Validar todos os FAQs
      for (const faq of faqs) {
        if (!faq.question || !faq.answer) {
          return res.status(400).json({
            success: false,
            message: 'Cada FAQ deve ter question e answer'
          });
        }
        if (faq.question.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Pergunta deve ter no maximo 500 caracteres'
          });
        }
        if (faq.answer.length > 2000) {
          return res.status(400).json({
            success: false,
            message: 'Resposta deve ter no maximo 2000 caracteres'
          });
        }
      }

      area.faqs = faqs;
      area.markModified('faqs'); // Marcar como modificado para garantir que seja salvo
    }

    // Garantir que os campos sejam marcados como modificados
    if (bairro !== undefined) area.markModified('bairro');
    if (nomeCidade !== undefined) area.markModified('nomeCidade');
    if (whatsapp !== undefined) area.markModified('whatsapp');
    if (typeof showWhatsapp === 'boolean') area.markModified('showWhatsapp');

    await area.save();

    // Debug: verificar o que foi salvo
    console.log('Dados salvos:', { 
      bairro: area.bairro, 
      nomeCidade: area.nomeCidade, 
      whatsapp: area.whatsapp, 
      showWhatsapp: area.showWhatsapp,
      faqs: area.faqs 
    });

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

    // Garantir que os dados sejam convertidos corretamente para JSON
    const specialPrices = (area.specialPrices || []).map(sp => sp.toObject ? sp.toObject() : sp);

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
    area.markModified('specialPrices'); // Marcar como modificado para garantir que seja salvo
    await area.save();

    // Recarregar o documento do banco para garantir dados atualizados
    await area.populate('owner', 'name email');
    const savedArea = await Area.findById(areaId);
    
    // Retornar o último preço adicionado
    const newPrice = savedArea.specialPrices[savedArea.specialPrices.length - 1];

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
    area.markModified('specialPrices'); // Marcar como modificado para garantir que seja salvo
    await area.save();

    // Recarregar o documento do banco para garantir dados atualizados
    const savedArea = await Area.findById(areaId);
    const updatedPriceIndex = savedArea.specialPrices.findIndex(
      sp => sp._id.toString() === priceId
    );

    res.json({
      success: true,
      message: 'Preco especial atualizado com sucesso',
      data: savedArea.specialPrices[updatedPriceIndex]
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
    area.markModified('specialPrices'); // Marcar como modificado para garantir que seja salvo
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
