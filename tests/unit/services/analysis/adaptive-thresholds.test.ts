import { 
  mapPremierRatingToRank, 
  AdaptiveThresholds,
  createAdaptiveThresholds 
} from '../../../../src/services/analysis/adaptive-thresholds';

describe('AdaptiveThresholds', () => {
  describe('mapPremierRatingToRank', () => {
    it('should map premier ratings to correct rank tiers', () => {
      // Gray tier (0-4,999)
      expect(mapPremierRatingToRank(0)).toBe('silver');
      expect(mapPremierRatingToRank(4999)).toBe('silver');
      
      // Light Blue tier (5,000-9,999)
      expect(mapPremierRatingToRank(5000)).toBe('gold_nova');
      expect(mapPremierRatingToRank(9999)).toBe('gold_nova');
      
      // Blue tier (10,000-14,999)
      expect(mapPremierRatingToRank(10000)).toBe('mg');
      expect(mapPremierRatingToRank(14999)).toBe('mg');
      
      // Purple tier (15,000-19,999)
      expect(mapPremierRatingToRank(15000)).toBe('dmg');
      expect(mapPremierRatingToRank(19999)).toBe('dmg');
      
      // Pink tier (20,000-24,999)
      expect(mapPremierRatingToRank(20000)).toBe('le');
      expect(mapPremierRatingToRank(24999)).toBe('le');
      
      // Red tier (25,000-29,999)
      expect(mapPremierRatingToRank(25000)).toBe('lem');
      expect(mapPremierRatingToRank(29999)).toBe('lem');
      
      // Gold/Yellow tier (30,000+)
      expect(mapPremierRatingToRank(30000)).toBe('supreme');
      expect(mapPremierRatingToRank(35000)).toBe('supreme');
    });
  });

  describe('AdaptiveThresholds', () => {
    it('should create thresholds for low rank player (Gray tier)', () => {
      const thresholds = new AdaptiveThresholds(3000); // Gray tier
      expect(thresholds.getRankTier()).toBe('silver');
      
      const strengthThresholds = thresholds.getStrengthThresholds();
      const weaknessThresholds = thresholds.getWeaknessThresholds();
      
      // Lower rank should have more forgiving thresholds
      expect(weaknessThresholds.rating).toBeLessThan(0.6); // More forgiving
      expect(strengthThresholds.rating).toBeGreaterThan(0.6); // But still achievable
    });

    it('should create thresholds for high rank player (Red tier)', () => {
      const thresholds = new AdaptiveThresholds(27000); // Red tier
      expect(thresholds.getRankTier()).toBe('lem');
      
      const strengthThresholds = thresholds.getStrengthThresholds();
      const weaknessThresholds = thresholds.getWeaknessThresholds();
      
      // Higher rank should have stricter thresholds
      expect(weaknessThresholds.rating).toBeGreaterThan(0.9); // Stricter weakness threshold
      expect(strengthThresholds.rating).toBeGreaterThan(1.2); // Higher strength requirement
    });

    it('should scale tilt thresholds based on rank', () => {
      const lowRankThresholds = new AdaptiveThresholds(3000); // Gray
      const highRankThresholds = new AdaptiveThresholds(27000); // Red
      
      const lowTiltThresholds = lowRankThresholds.getTiltThresholds();
      const highTiltThresholds = highRankThresholds.getTiltThresholds();
      
      // Higher rank should have stricter tilt detection
      expect(highTiltThresholds.reactionTimeThreshold).toBeLessThan(lowTiltThresholds.reactionTimeThreshold);
      expect(highTiltThresholds.consistencyThreshold).toBeLessThan(lowTiltThresholds.consistencyThreshold);
    });

    it('should provide adaptive area targets based on rank', () => {
      const lowRankThresholds = new AdaptiveThresholds(5000); // Light Blue
      const highRankThresholds = new AdaptiveThresholds(22000); // Pink
      
      const lowAreaTargets = lowRankThresholds.getAreaTargets();
      const highAreaTargets = highRankThresholds.getAreaTargets();
      
      // Higher rank should have more ambitious targets
      expect(highAreaTargets.aim.headshotPercentage).toBeGreaterThan(lowAreaTargets.aim.headshotPercentage);
      expect(highAreaTargets.teamwork.leadership).toBeGreaterThan(lowAreaTargets.teamwork.leadership);
    });

    it('should provide state patterns adapted to rank precision', () => {
      const lowRankThresholds = new AdaptiveThresholds(8000); // Light Blue
      const highRankThresholds = new AdaptiveThresholds(28000); // Red
      
      const lowStatePatterns = lowRankThresholds.getStatePatterns();
      const highStatePatterns = highRankThresholds.getStatePatterns();
      
      
      // Higher rank should have tighter variance thresholds for flow state
      expect(highStatePatterns.flow_state.preaim_threshold).toBeLessThan(lowStatePatterns.flow_state.preaim_threshold);
      expect(highStatePatterns.mechanical_inconsistency.ratingVariance).toBeLessThan(lowStatePatterns.mechanical_inconsistency.ratingVariance);
    });

    it('should use default values when no premier rating provided', () => {
      const thresholds = createAdaptiveThresholds(); // No rating provided
      expect(thresholds.getRankTier()).toBe('mg'); // Should default to MG (10k rating)
    });

    it('should handle edge cases and boundary values', () => {
      // Test exact boundary values
      expect(mapPremierRatingToRank(4999)).toBe('silver');
      expect(mapPremierRatingToRank(5000)).toBe('gold_nova');
      expect(mapPremierRatingToRank(29999)).toBe('lem');
      expect(mapPremierRatingToRank(30000)).toBe('supreme');
      
      // Test extreme values
      expect(mapPremierRatingToRank(-100)).toBe('silver'); // Negative should map to lowest
      expect(mapPremierRatingToRank(100000)).toBe('supreme'); // Very high should map to highest
    });
  });
});