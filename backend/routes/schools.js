const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const School = require('../models/School');

const router = express.Router();

// @route   GET /api/schools
// @desc    Get all Rwandan schools with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      type, 
      district, 
      province, 
      isPublic, 
      isBoarding,
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } },
        { sector: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (district) {
      query.district = { $regex: district, $options: 'i' };
    }

    if (province) {
      query.province = { $regex: province, $options: 'i' };
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    if (isBoarding !== undefined) {
      query.isBoarding = isBoarding === 'true';
    }

    // Get total count
    const totalSchools = await School.countDocuments(query);
    
    // Get paginated results
    const skip = (page - 1) * limit;
    const schools = await School.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      data: schools.map(school => ({
        _id: school._id,
        id: school._id,
        name: school.name,
        type: school.type,
        district: school.district,
        province: school.province,
        sector: school.sector,
        cell: school.cell,
        village: school.village,
        isPublic: school.isPublic,
        isBoarding: school.isBoarding,
        established: school.established,
        enrollment: school.enrollment
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSchools,
        pages: Math.ceil(totalSchools / limit)
      }
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

// @route   GET /api/schools/:id
// @desc    Get school by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: school._id,
        id: school._id,
        name: school.name,
        type: school.type,
        district: school.district,
        province: school.province,
        sector: school.sector,
        cell: school.cell,
        village: school.village,
        isPublic: school.isPublic,
        isBoarding: school.isBoarding,
        established: school.established,
        enrollment: school.enrollment
      }
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school'
    });
  }
});

// @route   GET /api/schools/stats/overview
// @desc    Get school statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalSchools = await School.countDocuments({ isActive: true });
    const primarySchools = await School.countDocuments({ type: 'PRIMARY', isActive: true });
    const secondarySchools = await School.countDocuments({ type: 'SECONDARY', isActive: true });
    const publicSchools = await School.countDocuments({ isPublic: true, isActive: true });
    const privateSchools = await School.countDocuments({ isPublic: false, isActive: true });
    const boardingSchools = await School.countDocuments({ isBoarding: true, isActive: true });

    const provinces = await School.distinct('province', { isActive: true });
    const districts = await School.distinct('district', { isActive: true });

    res.json({
      success: true,
      data: {
        totalSchools,
        primarySchools,
        secondarySchools,
        publicSchools,
        privateSchools,
        boardingSchools,
        provinces: provinces.length,
        districts: districts.length,
        provincesList: provinces.sort(),
        districtsList: districts.sort()
      }
    });
  } catch (error) {
    console.error('Get school stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school statistics'
    });
  }
});

module.exports = router;