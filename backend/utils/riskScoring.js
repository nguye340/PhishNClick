/**
 * Risk Scoring Algorithm for User Security Awareness
 * Calculates comprehensive risk scores based on multiple behavioral factors
 */

/**
 * Calculate accuracy-based risk score
 * Lower accuracy = higher risk
 * @param {number} correct - Number of correct interactions
 * @param {number} total - Total interactions
 * @returns {number} Risk score (0-100, higher = more risk)
 */
function calculateAccuracyRisk(correct, total) {
  if (total === 0) return 50; // Neutral risk for no data
  
  const accuracy = (correct / total) * 100;
  
  // Inverse relationship: low accuracy = high risk
  if (accuracy >= 90) return 5;   // Excellent
  if (accuracy >= 80) return 15;  // Good
  if (accuracy >= 70) return 30;  // Acceptable
  if (accuracy >= 60) return 50;  // Concerning
  if (accuracy >= 50) return 70;  // High risk
  return 90; // Critical risk
}

/**
 * Calculate reaction time risk score
 * Slower reactions = higher risk (impulsive or not paying attention)
 * @param {number} avgReactionMs - Average reaction time in milliseconds
 * @returns {number} Risk score (0-100)
 */
function calculateReactionTimeRisk(avgReactionMs) {
  if (!avgReactionMs) return 30; // Neutral-low risk for no data
  
  const avgReactionSec = avgReactionMs / 1000;
  
  // Too fast (< 1s) = impulsive = risky
  // Too slow (> 15s) = not engaged = risky
  // Sweet spot: 2-8 seconds
  
  if (avgReactionSec < 1) return 60;      // Too impulsive
  if (avgReactionSec < 2) return 20;      // Fast but reasonable
  if (avgReactionSec <= 8) return 5;      // Optimal range
  if (avgReactionSec <= 15) return 25;    // Slow but acceptable
  if (avgReactionSec <= 30) return 50;    // Very slow
  return 70; // Extremely slow or not engaged
}

/**
 * Calculate engagement risk score
 * Low engagement = higher risk (not practicing)
 * @param {number} totalInteractions - Total number of interactions
 * @param {number} sessionCount - Number of game sessions
 * @param {number} daysSinceLastActivity - Days since last activity
 * @returns {number} Risk score (0-100)
 */
function calculateEngagementRisk(totalInteractions, sessionCount, daysSinceLastActivity) {
  let riskScore = 0;
  
  // Factor 1: Total interactions (experience)
  if (totalInteractions < 10) riskScore += 40;
  else if (totalInteractions < 50) riskScore += 25;
  else if (totalInteractions < 100) riskScore += 10;
  else riskScore += 0;
  
  // Factor 2: Session count (consistency)
  if (sessionCount < 2) riskScore += 30;
  else if (sessionCount < 5) riskScore += 15;
  else if (sessionCount < 10) riskScore += 5;
  else riskScore += 0;
  
  // Factor 3: Recency (staying current)
  if (daysSinceLastActivity > 30) riskScore += 30;
  else if (daysSinceLastActivity > 14) riskScore += 20;
  else if (daysSinceLastActivity > 7) riskScore += 10;
  else riskScore += 0;
  
  return Math.min(riskScore, 100);
}

/**
 * Calculate category weakness risk
 * Identifies specific vulnerability areas
 * @param {Object} categoryStats - Category-level statistics
 * @returns {Object} { riskScore, weakCategories }
 */
function calculateCategoryRisk(categoryStats) {
  const weakCategories = [];
  let totalRisk = 0;
  let categoryCount = 0;
  
  for (const [category, stats] of Object.entries(categoryStats)) {
    const total = stats.correct + stats.incorrect;
    if (total === 0) continue;
    
    const accuracy = (stats.correct / total) * 100;
    categoryCount++;
    
    // Categories with < 70% accuracy are considered weak
    if (accuracy < 70) {
      weakCategories.push({
        category,
        accuracy: Math.round(accuracy),
        correct: stats.correct,
        incorrect: stats.incorrect,
        total
      });
      
      // Weight risk by severity
      if (accuracy < 50) totalRisk += 30;
      else if (accuracy < 60) totalRisk += 20;
      else totalRisk += 10;
    }
  }
  
  // Average risk across categories
  const avgRisk = categoryCount > 0 ? totalRisk / categoryCount : 0;
  
  return {
    riskScore: Math.min(avgRisk, 100),
    weakCategories: weakCategories.sort((a, b) => a.accuracy - b.accuracy)
  };
}

/**
 * Calculate trend-based risk
 * Declining performance = higher risk
 * @param {Array} recentSessions - Recent session data with timestamps and accuracy
 * @returns {number} Risk score (0-100)
 */
function calculateTrendRisk(recentSessions) {
  if (!recentSessions || recentSessions.length < 2) return 20; // Neutral for insufficient data
  
  // Compare first half vs second half of recent sessions
  const midpoint = Math.floor(recentSessions.length / 2);
  const firstHalf = recentSessions.slice(0, midpoint);
  const secondHalf = recentSessions.slice(midpoint);
  
  const avgFirst = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  // Declining trend = risk
  if (change < -15) return 70;  // Significant decline
  if (change < -10) return 50;  // Moderate decline
  if (change < -5) return 30;   // Slight decline
  if (change < 5) return 10;    // Stable
  return 0; // Improving
}

/**
 * Calculate game-specific risk patterns
 * Different games test different skills
 * @param {Object} gameStats - Per-game statistics
 * @returns {Object} { riskScore, concerningGames }
 */
function calculateGameSpecificRisk(gameStats) {
  const concerningGames = [];
  let totalRisk = 0;
  let gameCount = 0;
  
  // Weight different games by importance
  const gameWeights = {
    'Phish404': 1.2,           // Email phishing (critical)
    'Popup Manic': 1.0,        // Popup/malware awareness
    'Hooked or Cooked': 1.1,   // Email analysis
    'Phish Hunt': 0.9          // Quick reaction training
  };
  
  for (const [game, stats] of Object.entries(gameStats)) {
    const total = stats.interactions;
    if (total === 0) continue;
    
    const accuracy = stats.accuracy;
    const weight = gameWeights[game] || 1.0;
    gameCount++;
    
    if (accuracy < 70) {
      concerningGames.push({
        game,
        accuracy: Math.round(accuracy),
        interactions: total,
        weight
      });
      
      // Apply weighted risk
      const baseRisk = accuracy < 50 ? 30 : accuracy < 60 ? 20 : 10;
      totalRisk += baseRisk * weight;
    }
  }
  
  const avgRisk = gameCount > 0 ? totalRisk / gameCount : 0;
  
  return {
    riskScore: Math.min(avgRisk, 100),
    concerningGames: concerningGames.sort((a, b) => a.accuracy - b.accuracy)
  };
}

/**
 * Main risk scoring function
 * Aggregates all risk factors into a comprehensive score
 * @param {Object} userData - User's complete telemetry and activity data
 * @returns {Object} Comprehensive risk assessment
 */
export function calculateUserRiskScore(userData) {
  const {
    totalInteractions = 0,
    correctInteractions = 0,
    incorrectInteractions = 0,
    avgReactionMs = null,
    sessionCount = 0,
    lastActivityDate = null,
    categoryStats = {},
    gameStats = {},
    recentSessions = []
  } = userData;
  
  // Calculate days since last activity
  const daysSinceLastActivity = lastActivityDate 
    ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Calculate individual risk factors
  const accuracyRisk = calculateAccuracyRisk(correctInteractions, totalInteractions);
  const reactionTimeRisk = calculateReactionTimeRisk(avgReactionMs);
  const engagementRisk = calculateEngagementRisk(totalInteractions, sessionCount, daysSinceLastActivity);
  const categoryRiskData = calculateCategoryRisk(categoryStats);
  const trendRisk = calculateTrendRisk(recentSessions);
  const gameRiskData = calculateGameSpecificRisk(gameStats);
  
  // Weighted average of all risk factors
  const weights = {
    accuracy: 0.30,      // 30% - Most important
    engagement: 0.20,    // 20% - Practice matters
    category: 0.20,      // 20% - Specific weaknesses
    reactionTime: 0.10,  // 10% - Behavioral indicator
    trend: 0.10,         // 10% - Performance trajectory
    game: 0.10           // 10% - Game-specific patterns
  };
  
  const overallScore = Math.round(
    accuracyRisk * weights.accuracy +
    engagementRisk * weights.engagement +
    categoryRiskData.riskScore * weights.category +
    reactionTimeRisk * weights.reactionTime +
    trendRisk * weights.trend +
    gameRiskData.riskScore * weights.game
  );
  
  // Determine risk level
  let riskLevel;
  if (overallScore >= 70) riskLevel = 'CRITICAL';
  else if (overallScore >= 50) riskLevel = 'HIGH';
  else if (overallScore >= 30) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    overallScore,
    accuracyRisk,
    engagementRisk,
    categoryRiskData,
    gameRiskData,
    daysSinceLastActivity,
    totalInteractions
  });
  
  return {
    userId: userData.userId,
    overallScore,
    riskLevel,
    factors: {
      accuracyScore: accuracyRisk,
      reactionTimeScore: reactionTimeRisk,
      engagementScore: engagementRisk,
      categoryScore: categoryRiskData.riskScore,
      trendScore: trendRisk,
      gameScore: gameRiskData.riskScore
    },
    weakCategories: categoryRiskData.weakCategories,
    concerningGames: gameRiskData.concerningGames,
    recommendations,
    metadata: {
      totalInteractions,
      accuracy: totalInteractions > 0 ? Math.round((correctInteractions / totalInteractions) * 100) : 0,
      sessionCount,
      daysSinceLastActivity,
      lastActivityDate
    }
  };
}

/**
 * Generate actionable recommendations based on risk factors
 * @param {Object} riskData - Risk assessment data
 * @returns {Array<string>} List of recommendations
 */
function generateRecommendations(riskData) {
  const recommendations = [];
  const { overallScore, accuracyRisk, engagementRisk, categoryRiskData, gameRiskData, daysSinceLastActivity, totalInteractions } = riskData;
  
  // Critical overall risk
  if (overallScore >= 70) {
    recommendations.push('🚨 URGENT: Schedule immediate security awareness training');
    recommendations.push('Consider restricting access to sensitive systems until training is completed');
  }
  
  // Accuracy issues
  if (accuracyRisk >= 50) {
    recommendations.push('📚 Assign foundational phishing awareness modules');
    recommendations.push('Review basic security principles with user');
  }
  
  // Engagement issues
  if (engagementRisk >= 50) {
    if (totalInteractions < 10) {
      recommendations.push('🎮 User needs to complete initial training games');
    }
    if (daysSinceLastActivity > 30) {
      recommendations.push('⏰ Send reminder: User has not trained in over 30 days');
    }
  }
  
  // Category weaknesses
  if (categoryRiskData.weakCategories.length > 0) {
    const weakest = categoryRiskData.weakCategories[0];
    recommendations.push(`🎯 Focus training on: ${weakest.category} (${weakest.accuracy}% accuracy)`);
  }
  
  // Game-specific issues
  if (gameRiskData.concerningGames.length > 0) {
    const weakestGame = gameRiskData.concerningGames[0];
    recommendations.push(`🎲 Assign additional practice in: ${weakestGame.game}`);
  }
  
  // Positive reinforcement
  if (overallScore < 30) {
    recommendations.push('✅ User demonstrates strong security awareness - maintain regular practice');
  }
  
  return recommendations;
}

/**
 * Calculate organization-wide risk metrics
 * @param {Array} allUserRiskScores - Array of all user risk assessments
 * @returns {Object} Organization-level risk analytics
 */
export function calculateOrganizationRisk(allUserRiskScores) {
  if (!allUserRiskScores || allUserRiskScores.length === 0) {
    return {
      totalUsers: 0,
      averageRiskScore: 0,
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      highRiskUsers: [],
      commonWeaknesses: [],
      organizationRiskLevel: 'UNKNOWN'
    };
  }
  
  const totalUsers = allUserRiskScores.length;
  const totalRisk = allUserRiskScores.reduce((sum, user) => sum + user.overallScore, 0);
  const averageRiskScore = Math.round(totalRisk / totalUsers);
  
  // Risk distribution
  const riskDistribution = {
    LOW: allUserRiskScores.filter(u => u.riskLevel === 'LOW').length,
    MEDIUM: allUserRiskScores.filter(u => u.riskLevel === 'MEDIUM').length,
    HIGH: allUserRiskScores.filter(u => u.riskLevel === 'HIGH').length,
    CRITICAL: allUserRiskScores.filter(u => u.riskLevel === 'CRITICAL').length
  };
  
  // High-risk users (HIGH or CRITICAL)
  const highRiskUsers = allUserRiskScores
    .filter(u => u.overallScore >= 50)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 20); // Top 20 highest risk
  
  // Aggregate common weaknesses
  const categoryWeaknessMap = {};
  allUserRiskScores.forEach(user => {
    user.weakCategories.forEach(cat => {
      if (!categoryWeaknessMap[cat.category]) {
        categoryWeaknessMap[cat.category] = { count: 0, totalAccuracy: 0 };
      }
      categoryWeaknessMap[cat.category].count++;
      categoryWeaknessMap[cat.category].totalAccuracy += cat.accuracy;
    });
  });
  
  const commonWeaknesses = Object.entries(categoryWeaknessMap)
    .map(([category, data]) => ({
      category,
      affectedUsers: data.count,
      avgAccuracy: Math.round(data.totalAccuracy / data.count),
      percentageOfUsers: Math.round((data.count / totalUsers) * 100)
    }))
    .sort((a, b) => b.affectedUsers - a.affectedUsers)
    .slice(0, 10);
  
  // Organization risk level
  let organizationRiskLevel;
  const criticalPercentage = (riskDistribution.CRITICAL / totalUsers) * 100;
  const highPercentage = (riskDistribution.HIGH / totalUsers) * 100;
  
  if (criticalPercentage > 10 || averageRiskScore >= 60) {
    organizationRiskLevel = 'CRITICAL';
  } else if (highPercentage > 20 || averageRiskScore >= 45) {
    organizationRiskLevel = 'HIGH';
  } else if (averageRiskScore >= 30) {
    organizationRiskLevel = 'MEDIUM';
  } else {
    organizationRiskLevel = 'LOW';
  }
  
  return {
    totalUsers,
    averageRiskScore,
    riskDistribution,
    highRiskUsers,
    commonWeaknesses,
    organizationRiskLevel,
    metrics: {
      criticalPercentage: Math.round(criticalPercentage),
      highPercentage: Math.round(highPercentage),
      mediumPercentage: Math.round((riskDistribution.MEDIUM / totalUsers) * 100),
      lowPercentage: Math.round((riskDistribution.LOW / totalUsers) * 100)
    }
  };
}
