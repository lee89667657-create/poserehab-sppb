// Mapping from posture analysis muscle IDs → anatomy viewer region keys
// Posture muscle IDs come from MuscleInfo.id (posture-store)
// Anatomy region keys come from ANATOMY_DB (anatomy-data.ts)

/**
 * Maps a posture analysis muscle ID to the best-matching anatomy region key.
 * Uses left side ('_l') by default since posture analysis doesn't distinguish sides.
 */
const MUSCLE_TO_REGION: Record<string, string> = {
  // Front muscles (typically contracted)
  neck_flexors: 'neck_l',
  pectoralis: 'chest_l',
  serratus_anterior: 'chest_l',
  external_oblique: 'abdomen_l',
  internal_oblique: 'abdomen_l',
  transverse_abdominis: 'abdomen_l',
  rectus_abdominis: 'abdomen_l',
  iliopsoas: 'hip_l',
  hip_flexors: 'hip_l',
  tensor_fasciae: 'thigh_l',
  rectus_femoris: 'thigh_l',
  adductors: 'thigh_l',
  tibialis_anterior: 'shin_l',

  // Rear muscles (typically stretched)
  neck_extensors: 'neck_l',
  upper_trapezius: 'neck_l',
  levator_scapulae: 'neck_l',
  middle_trapezius: 'upper_back_l',
  lower_trapezius: 'upper_back_l',
  rhomboids: 'upper_back_l',
  infraspinatus: 'shoulder_l',
  latissimus_dorsi: 'upper_back_l',
  thoracic_erector: 'upper_back_l',
  lumbar_muscles: 'lower_back_l',
  lumbar_erector: 'lower_back_l',
  gluteus_maximus: 'hip_l',
  gluteus_medius: 'hip_l',
  hamstrings: 'thigh_l',
  gastrocnemius: 'shin_l',
}

/**
 * Get the anatomy region key for a given posture muscle ID.
 * Returns null if no mapping exists.
 */
export function muscleIdToRegionKey(muscleId: string): string | null {
  return MUSCLE_TO_REGION[muscleId] ?? null
}

/**
 * Reverse mapping: find muscle IDs that belong to a given anatomy region.
 */
export function regionKeyToMuscleIds(regionKey: string): string[] {
  return Object.entries(MUSCLE_TO_REGION)
    .filter(([, region]) => region === regionKey)
    .map(([muscleId]) => muscleId)
}

// Also map exercise targetMuscle names → anatomy region keys
// Used by exercise-recommendations page for clickable muscle tags
const TARGET_MUSCLE_TO_REGION: Record<string, string> = {
  'deep neck flexors': 'neck_l',
  'longus colli': 'neck_l',
  'pectoralis major': 'chest_l',
  'pectoralis minor': 'chest_l',
  'anterior deltoid': 'shoulder_l',
  'serratus anterior': 'chest_l',
  'obliques': 'abdomen_l',
  'rectus abdominis': 'abdomen_l',
  'transverse abdominis': 'abdomen_l',
  'hip flexors': 'hip_l',
  'tensor fasciae latae': 'thigh_l',
  'iliotibial band': 'thigh_l',
  'quadriceps': 'thigh_l',
  'rectus femoris': 'thigh_l',
  'adductors': 'thigh_l',
  'tibialis anterior': 'shin_l',
  'upper trapezius': 'neck_l',
  'levator scapulae': 'neck_l',
  'rhomboids': 'upper_back_l',
  'lower trapezius': 'upper_back_l',
  'middle trapezius': 'upper_back_l',
  'infraspinatus': 'shoulder_l',
  'rear deltoids': 'shoulder_l',
  'lats': 'upper_back_l',
  'latissimus dorsi': 'upper_back_l',
  'erector spinae': 'lower_back_l',
  'lumbar muscles': 'lower_back_l',
  'glutes': 'hip_l',
  'gluteus maximus': 'hip_l',
  'gluteus medius': 'hip_l',
  'gluteus minimus': 'hip_l',
  'external rotators': 'hip_l',
  'hamstrings': 'thigh_l',
  'calves': 'shin_l',
  'gastrocnemius': 'shin_l',
}

/**
 * Get the anatomy region key for an exercise target muscle name.
 * Case-insensitive lookup.
 */
export function targetMuscleToRegionKey(targetMuscle: string): string | null {
  const lower = targetMuscle.toLowerCase()
  for (const [key, region] of Object.entries(TARGET_MUSCLE_TO_REGION)) {
    if (key.toLowerCase() === lower) return region
  }
  return null
}
