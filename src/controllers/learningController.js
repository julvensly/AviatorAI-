import { completeGrowthRound } from '../services/growthLearningService.js';
import { analyzeGrowthRecords } from '../services/growthAnalysisService.js';
import {
  addGrowthObservation,
  getGrowthObservations
} from '../services/growthLearningService.js';

export async function createGrowthObservation(req, res) {
  try {
    const record = await addGrowthObservation(req.body);

    return res.status(201).json({
      success: true,
      message: 'Obsèvasyon kwasans yo anrejistre.',
      record
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function listGrowthObservations(req, res) {
  try {
    const records = await getGrowthObservations();

    return res.json({
      success: true,
      total: records.length,
      records
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Nou pa kapab rekipere obsèvasyon yo.'
    });
  }
}

export async function analyzeGrowth(req, res) {
  try {
    const records = await getGrowthObservations();

    const analysis = analyzeGrowthRecords(records);

    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Nou pa kapab analize kwasans lan.'
    });
  }
}

export async function completeRound(req, res) {
  try {
    const record = await completeGrowthRound(req.body);

    return res.json({
      success: true,
      message: 'Rezilta final wonn nan anrejistre.',
      record
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
