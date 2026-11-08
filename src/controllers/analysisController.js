import { calculateDuration } from '../services/calculationService.js';
import {
  addRound,
  getRounds
} from '../services/dataService.js';

export function analyzeDuration(req, res) {
  try {
    const { multiplier, rate } = req.body;

    if (
      multiplier === undefined ||
      rate === undefined ||
      multiplier === '' ||
      rate === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Miltiplikatè ak vitès obligatwa.'
      });
    }

    const result = calculateDuration(
      Number(multiplier),
      Number(rate)
    );

    return res.json({
      success: true,
      analysis: result,
      explanation:
        'Kalkil sa a sipoze yon vitès lineyè konstan depi 1x. Li pa prevwa dire reyèl yon wonn o aza.'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function createRound(req, res) {
  try {
    const { multiplier, durationSeconds, source } = req.body;

    if (
      multiplier === undefined ||
      multiplier === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Miltiplikatè obligatwa.'
      });
    }

    if (
      durationSeconds === undefined ||
      durationSeconds === null
        ? false
        : durationSeconds === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Dire a dwe yon nimewo oswa null.'
      });
    }

    if (typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sous done a obligatwa.'
      });
    }

    const round = await addRound({
      multiplier: Number(multiplier),
      durationSeconds:
        durationSeconds === null
          ? null
          : Number(durationSeconds),
      source
    });

    return res.status(201).json({
      success: true,
      message: 'Rezilta anrejistre avèk siksè.',
      round
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function listRounds(req, res) {
  try {
    const rounds = await getRounds();

    return res.json({
      success: true,
      total: rounds.length,
      rounds
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Nou pa kapab rekipere rezilta yo.'
    });
  }
}

import { analyzeRounds } from '../services/reasoningService.js';

export async function analyzeHistoricalRounds(req, res) {
  try {
    const rounds = await getRounds();

    const analysis = analyzeRounds(rounds);

    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Nou pa kapab analize done istorik yo."
    });
  }
}
