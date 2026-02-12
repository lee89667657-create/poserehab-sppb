-- ============================================================
-- PoseRehab - 전체 환자 6개 평가도구 더미 데이터 보완
-- 기존 데이터에 누락된 평가 타입만 추가 (기존 데이터 삭제 안 함)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 공통 therapist_id: therapists 테이블에서 동적으로 조회
-- (SELECT id FROM therapists LIMIT 1)

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자1: 김영수 (a0000001-...01)
--   진단: Lt. MCA infarction, Rt. hemiplegia
--   기존: BBS(4), FAC(3), MBI(3), MMT(2)
--   추가: ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- ROM: Rt측 제한, 점진 개선
('a0000001-0000-0000-0000-000000000001', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":175,"extension":55,"abduction":175},"rt":{"flexion":110,"extension":25,"abduction":90}},"knee":{"lt":{"flexion":130,"extension":0},"rt":{"flexion":85,"extension":-10}},"hip":{"lt":{"flexion":115,"extension":25,"abduction":40},"rt":{"flexion":75,"extension":10,"abduction":20}}}}',
 '2026-01-15 15:00:00+09'),
('a0000001-0000-0000-0000-000000000001', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":178,"extension":58,"abduction":178},"rt":{"flexion":135,"extension":35,"abduction":115}},"knee":{"lt":{"flexion":132,"extension":0},"rt":{"flexion":105,"extension":-5}},"hip":{"lt":{"flexion":118,"extension":28,"abduction":42},"rt":{"flexion":90,"extension":15,"abduction":28}}}}',
 '2026-02-04 15:00:00+09'),
-- HandFunction: Rt측 약함 (Rt hemiplegia), 점진 개선
('a0000001-0000-0000-0000-000000000001', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":30,"rightTotalScore":8,"scores":{"grasp":{"left":4,"right":1},"grip":{"left":4,"right":1},"lateral_pinch":{"left":4,"right":1},"tip_pinch":{"left":4,"right":1},"cylinder":{"left":4,"right":1},"sphere":{"left":4,"right":1},"hook":{"left":3,"right":1},"intrinsic_plus":{"left":3,"right":1}}}',
 '2026-01-15 16:00:00+09'),
('a0000001-0000-0000-0000-000000000001', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":31,"rightTotalScore":14,"scores":{"grasp":{"left":4,"right":2},"grip":{"left":4,"right":2},"lateral_pinch":{"left":4,"right":2},"tip_pinch":{"left":4,"right":2},"cylinder":{"left":4,"right":2},"sphere":{"left":4,"right":2},"hook":{"left":3,"right":1},"intrinsic_plus":{"left":4,"right":1}}}',
 '2026-02-04 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자2: 박순희 (a0000001-...02)
--   진단: Rt. MCA infarction, Lt. hemiplegia
--   기존: BBS(3), FAC(3), MBI(3)
--   추가: MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- MMT: Lt측 약함 (Lt hemiplegia)
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":2,"rt":5},"elbow_flexor_extensor":{"lt":2,"rt":5},"wrist_flexor_extensor":{"lt":1,"rt":5},"hip_flexor":{"lt":2,"rt":5},"knee_extensor":{"lt":2,"rt":5},"ankle_dorsiflexor":{"lt":1,"rt":5}}}',
 '2025-12-22 14:00:00+09'),
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":3,"rt":5},"elbow_flexor_extensor":{"lt":3,"rt":5},"wrist_flexor_extensor":{"lt":2,"rt":5},"hip_flexor":{"lt":3,"rt":5},"knee_extensor":{"lt":3,"rt":5},"ankle_dorsiflexor":{"lt":2,"rt":5}}}',
 '2026-02-01 14:00:00+09'),
-- ROM: Lt측 제한
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":100,"extension":20,"abduction":80},"rt":{"flexion":175,"extension":55,"abduction":175}},"knee":{"lt":{"flexion":80,"extension":-15},"rt":{"flexion":130,"extension":0}},"hip":{"lt":{"flexion":70,"extension":8,"abduction":18},"rt":{"flexion":115,"extension":25,"abduction":40}}}}',
 '2025-12-22 15:00:00+09'),
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":125,"extension":30,"abduction":105},"rt":{"flexion":178,"extension":58,"abduction":178}},"knee":{"lt":{"flexion":100,"extension":-5},"rt":{"flexion":132,"extension":0}},"hip":{"lt":{"flexion":85,"extension":12,"abduction":25},"rt":{"flexion":118,"extension":28,"abduction":42}}}}',
 '2026-02-01 15:00:00+09'),
-- HandFunction: Lt측 약함
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":6,"rightTotalScore":29,"scores":{"grasp":{"left":1,"right":4},"grip":{"left":1,"right":4},"lateral_pinch":{"left":1,"right":4},"tip_pinch":{"left":1,"right":4},"cylinder":{"left":0,"right":4},"sphere":{"left":1,"right":4},"hook":{"left":0,"right":3},"intrinsic_plus":{"left":1,"right":2}}}',
 '2025-12-22 16:00:00+09'),
('a0000001-0000-0000-0000-000000000002', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":12,"rightTotalScore":30,"scores":{"grasp":{"left":2,"right":4},"grip":{"left":2,"right":4},"lateral_pinch":{"left":1,"right":4},"tip_pinch":{"left":2,"right":4},"cylinder":{"left":1,"right":4},"sphere":{"left":2,"right":4},"hook":{"left":1,"right":3},"intrinsic_plus":{"left":1,"right":3}}}',
 '2026-02-01 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자3: 이정민 (a0000001-...03)
--   진단: TBI, Rt. hemiparesis
--   기존: BBS(3), FAC(2), MBI(3)
--   추가: MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- MMT: Rt측 약함
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":3},"elbow_flexor_extensor":{"lt":5,"rt":3},"wrist_flexor_extensor":{"lt":5,"rt":2},"hip_flexor":{"lt":5,"rt":3},"knee_extensor":{"lt":5,"rt":3},"ankle_dorsiflexor":{"lt":5,"rt":2}}}',
 '2026-01-08 14:00:00+09'),
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":4},"elbow_flexor_extensor":{"lt":5,"rt":4},"wrist_flexor_extensor":{"lt":5,"rt":3},"hip_flexor":{"lt":5,"rt":4},"knee_extensor":{"lt":5,"rt":4},"ankle_dorsiflexor":{"lt":5,"rt":3}}}',
 '2026-02-03 14:00:00+09'),
-- ROM: Rt측 제한
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":178,"extension":58,"abduction":178},"rt":{"flexion":130,"extension":32,"abduction":110}},"knee":{"lt":{"flexion":132,"extension":0},"rt":{"flexion":95,"extension":-8}},"hip":{"lt":{"flexion":118,"extension":28,"abduction":42},"rt":{"flexion":85,"extension":12,"abduction":25}}}}',
 '2026-01-08 15:00:00+09'),
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":180,"extension":60,"abduction":180},"rt":{"flexion":155,"extension":45,"abduction":140}},"knee":{"lt":{"flexion":135,"extension":0},"rt":{"flexion":118,"extension":-2}},"hip":{"lt":{"flexion":120,"extension":30,"abduction":45},"rt":{"flexion":100,"extension":18,"abduction":32}}}}',
 '2026-02-03 15:00:00+09'),
-- HandFunction: Rt측 약함
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":30,"rightTotalScore":12,"scores":{"grasp":{"left":4,"right":2},"grip":{"left":4,"right":2},"lateral_pinch":{"left":4,"right":1},"tip_pinch":{"left":4,"right":2},"cylinder":{"left":4,"right":1},"sphere":{"left":4,"right":2},"hook":{"left":3,"right":1},"intrinsic_plus":{"left":3,"right":1}}}',
 '2026-01-08 16:00:00+09'),
('a0000001-0000-0000-0000-000000000003', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":31,"rightTotalScore":20,"scores":{"grasp":{"left":4,"right":3},"grip":{"left":4,"right":3},"lateral_pinch":{"left":4,"right":2},"tip_pinch":{"left":4,"right":3},"cylinder":{"left":4,"right":3},"sphere":{"left":4,"right":3},"hook":{"left":3,"right":2},"intrinsic_plus":{"left":4,"right":1}}}',
 '2026-02-03 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자4: 최미영 (a0000001-...04)
--   진단: Lt. MCA infarction, Rt. hemiplegia
--   기존: BBS(4), FAC(3), MBI(3), MMT(2)
--   추가: ROM(2), HandFunction(2)
--   ※ 기존 MMT가 lt 약함으로 되어 있으므로 동일 패턴 유지
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- ROM: 기존 MMT 패턴(lt측 약함) 유지
('a0000001-0000-0000-0000-000000000004', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":115,"extension":25,"abduction":95},"rt":{"flexion":175,"extension":55,"abduction":175}},"knee":{"lt":{"flexion":90,"extension":-10},"rt":{"flexion":130,"extension":0}},"hip":{"lt":{"flexion":78,"extension":10,"abduction":22},"rt":{"flexion":115,"extension":25,"abduction":40}}}}',
 '2026-01-12 15:00:00+09'),
('a0000001-0000-0000-0000-000000000004', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":140,"extension":35,"abduction":120},"rt":{"flexion":178,"extension":58,"abduction":178}},"knee":{"lt":{"flexion":110,"extension":-3},"rt":{"flexion":132,"extension":0}},"hip":{"lt":{"flexion":95,"extension":15,"abduction":30},"rt":{"flexion":118,"extension":28,"abduction":42}}}}',
 '2026-02-05 15:00:00+09'),
-- HandFunction: lt측 약함
('a0000001-0000-0000-0000-000000000004', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":9,"rightTotalScore":28,"scores":{"grasp":{"left":1,"right":4},"grip":{"left":1,"right":4},"lateral_pinch":{"left":1,"right":4},"tip_pinch":{"left":2,"right":4},"cylinder":{"left":1,"right":4},"sphere":{"left":1,"right":3},"hook":{"left":1,"right":3},"intrinsic_plus":{"left":1,"right":2}}}',
 '2026-01-12 16:00:00+09'),
('a0000001-0000-0000-0000-000000000004', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":16,"rightTotalScore":30,"scores":{"grasp":{"left":2,"right":4},"grip":{"left":2,"right":4},"lateral_pinch":{"left":2,"right":4},"tip_pinch":{"left":3,"right":4},"cylinder":{"left":2,"right":4},"sphere":{"left":2,"right":4},"hook":{"left":1,"right":3},"intrinsic_plus":{"left":2,"right":3}}}',
 '2026-02-05 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자5: 한상우 (a0000001-...05)
--   진단: 파킨슨 H&Y Stage 3 (양측성 경직, 대칭적 약화)
--   기존: BBS(5), FAC(3), MBI(3)
--   추가: MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- MMT: 양측 대칭적 약화 (파킨슨 경직)
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":4},"elbow_flexor_extensor":{"lt":4,"rt":4},"wrist_flexor_extensor":{"lt":3,"rt":3},"hip_flexor":{"lt":4,"rt":4},"knee_extensor":{"lt":4,"rt":4},"ankle_dorsiflexor":{"lt":3,"rt":3}}}',
 '2025-11-25 14:00:00+09'),
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":4},"elbow_flexor_extensor":{"lt":4,"rt":4},"wrist_flexor_extensor":{"lt":4,"rt":3},"hip_flexor":{"lt":4,"rt":4},"knee_extensor":{"lt":4,"rt":4},"ankle_dorsiflexor":{"lt":4,"rt":4}}}',
 '2026-02-04 14:00:00+09'),
-- ROM: 양측 경직으로 제한, 거의 대칭
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":155,"extension":40,"abduction":150},"rt":{"flexion":150,"extension":38,"abduction":148}},"knee":{"lt":{"flexion":115,"extension":-5},"rt":{"flexion":112,"extension":-5}},"hip":{"lt":{"flexion":100,"extension":18,"abduction":32},"rt":{"flexion":98,"extension":15,"abduction":30}}}}',
 '2025-11-25 15:00:00+09'),
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":162,"extension":45,"abduction":158},"rt":{"flexion":158,"extension":42,"abduction":155}},"knee":{"lt":{"flexion":120,"extension":-2},"rt":{"flexion":118,"extension":-3}},"hip":{"lt":{"flexion":108,"extension":22,"abduction":36},"rt":{"flexion":105,"extension":20,"abduction":34}}}}',
 '2026-02-04 15:00:00+09'),
-- HandFunction: 양측 미세운동 저하 (파킨슨 떨림/경직)
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":20,"rightTotalScore":19,"scores":{"grasp":{"left":3,"right":3},"grip":{"left":3,"right":3},"lateral_pinch":{"left":3,"right":2},"tip_pinch":{"left":2,"right":2},"cylinder":{"left":3,"right":3},"sphere":{"left":2,"right":2},"hook":{"left":2,"right":2},"intrinsic_plus":{"left":2,"right":2}}}',
 '2025-11-25 16:00:00+09'),
('a0000001-0000-0000-0000-000000000005', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":23,"rightTotalScore":22,"scores":{"grasp":{"left":3,"right":3},"grip":{"left":3,"right":3},"lateral_pinch":{"left":3,"right":3},"tip_pinch":{"left":3,"right":3},"cylinder":{"left":3,"right":3},"sphere":{"left":3,"right":3},"hook":{"left":2,"right":2},"intrinsic_plus":{"left":3,"right":2}}}',
 '2026-02-04 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자6: 정은주 (a0000001-...06)
--   진단: Rt. ACA infarction, Lt. lower extremity weakness
--   기존: BBS(1), FAC(1), MBI(1)
--   추가: BBS(1), FAC(1), MBI(1) 2회차 + MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
-- 기존 평가 2회차
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'BBS', 27, '{"riskLevel":"medium"}', '2026-02-05 09:00:00+09'),
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'FAC', 2, '{"notes":"간헐적 보조 필요"}', '2026-02-05 10:00:00+09'),
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'MBI', 48, '{}', '2026-02-05 11:00:00+09'),
-- MMT: Lt 하지 약함 (ACA → 하지 위주)
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":5},"elbow_flexor_extensor":{"lt":4,"rt":5},"wrist_flexor_extensor":{"lt":4,"rt":5},"hip_flexor":{"lt":2,"rt":5},"knee_extensor":{"lt":2,"rt":5},"ankle_dorsiflexor":{"lt":2,"rt":5}}}',
 '2026-01-18 14:00:00+09'),
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":5},"elbow_flexor_extensor":{"lt":5,"rt":5},"wrist_flexor_extensor":{"lt":4,"rt":5},"hip_flexor":{"lt":3,"rt":5},"knee_extensor":{"lt":3,"rt":5},"ankle_dorsiflexor":{"lt":3,"rt":5}}}',
 '2026-02-05 14:00:00+09'),
-- ROM
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":165,"extension":48,"abduction":160},"rt":{"flexion":178,"extension":58,"abduction":178}},"knee":{"lt":{"flexion":85,"extension":-12},"rt":{"flexion":132,"extension":0}},"hip":{"lt":{"flexion":72,"extension":8,"abduction":18},"rt":{"flexion":118,"extension":28,"abduction":42}}}}',
 '2026-01-18 15:00:00+09'),
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":170,"extension":52,"abduction":168},"rt":{"flexion":180,"extension":60,"abduction":180}},"knee":{"lt":{"flexion":105,"extension":-5},"rt":{"flexion":135,"extension":0}},"hip":{"lt":{"flexion":88,"extension":14,"abduction":25},"rt":{"flexion":120,"extension":30,"abduction":45}}}}',
 '2026-02-05 15:00:00+09'),
-- HandFunction: 상지는 거의 정상 (ACA → 하지 위주)
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":24,"rightTotalScore":30,"scores":{"grasp":{"left":3,"right":4},"grip":{"left":3,"right":4},"lateral_pinch":{"left":3,"right":4},"tip_pinch":{"left":3,"right":4},"cylinder":{"left":3,"right":4},"sphere":{"left":3,"right":4},"hook":{"left":3,"right":3},"intrinsic_plus":{"left":3,"right":3}}}',
 '2026-01-18 16:00:00+09'),
('a0000001-0000-0000-0000-000000000006', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":27,"rightTotalScore":31,"scores":{"grasp":{"left":4,"right":4},"grip":{"left":3,"right":4},"lateral_pinch":{"left":3,"right":4},"tip_pinch":{"left":4,"right":4},"cylinder":{"left":3,"right":4},"sphere":{"left":4,"right":4},"hook":{"left":3,"right":3},"intrinsic_plus":{"left":3,"right":4}}}',
 '2026-02-05 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자7: 오동혁 (a0000001-...07)
--   진단: TBI (낙상), diffuse axonal injury
--   기존: BBS(1), FAC(1)
--   추가: BBS(1), FAC(1) 2회차 + MBI(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'BBS', 30, '{"riskLevel":"medium"}', '2026-02-05 09:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'FAC', 3, '{"notes":"감독 하 보행 가능"}', '2026-02-05 10:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'MBI', 40, '{}', '2026-01-22 11:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'MBI', 55, '{}', '2026-02-05 11:00:00+09'),
-- MMT: DAI → 양측 약화, Rt 약간 더 약함
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":3},"elbow_flexor_extensor":{"lt":4,"rt":3},"wrist_flexor_extensor":{"lt":4,"rt":3},"hip_flexor":{"lt":4,"rt":3},"knee_extensor":{"lt":4,"rt":3},"ankle_dorsiflexor":{"lt":3,"rt":3}}}',
 '2026-01-22 14:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":4},"elbow_flexor_extensor":{"lt":5,"rt":4},"wrist_flexor_extensor":{"lt":4,"rt":4},"hip_flexor":{"lt":5,"rt":4},"knee_extensor":{"lt":5,"rt":4},"ankle_dorsiflexor":{"lt":4,"rt":4}}}',
 '2026-02-05 14:00:00+09'),
-- ROM
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":168,"extension":48,"abduction":165},"rt":{"flexion":155,"extension":40,"abduction":150}},"knee":{"lt":{"flexion":125,"extension":-3},"rt":{"flexion":115,"extension":-5}},"hip":{"lt":{"flexion":110,"extension":22,"abduction":38},"rt":{"flexion":100,"extension":18,"abduction":32}}}}',
 '2026-01-22 15:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":175,"extension":55,"abduction":172},"rt":{"flexion":168,"extension":48,"abduction":165}},"knee":{"lt":{"flexion":130,"extension":0},"rt":{"flexion":125,"extension":-2}},"hip":{"lt":{"flexion":115,"extension":25,"abduction":42},"rt":{"flexion":108,"extension":22,"abduction":36}}}}',
 '2026-02-05 15:00:00+09'),
-- HandFunction
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":24,"rightTotalScore":18,"scores":{"grasp":{"left":3,"right":2},"grip":{"left":3,"right":3},"lateral_pinch":{"left":3,"right":2},"tip_pinch":{"left":3,"right":2},"cylinder":{"left":3,"right":2},"sphere":{"left":3,"right":3},"hook":{"left":3,"right":2},"intrinsic_plus":{"left":3,"right":2}}}',
 '2026-01-22 16:00:00+09'),
('a0000001-0000-0000-0000-000000000007', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":28,"rightTotalScore":24,"scores":{"grasp":{"left":4,"right":3},"grip":{"left":4,"right":3},"lateral_pinch":{"left":3,"right":3},"tip_pinch":{"left":4,"right":3},"cylinder":{"left":3,"right":3},"sphere":{"left":4,"right":3},"hook":{"left":3,"right":3},"intrinsic_plus":{"left":3,"right":3}}}',
 '2026-02-05 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자9: 윤재호 (a0000001-...09)
--   진단: T12 incomplete SCI, paraparesis (상지 정상, 하지 약화)
--   기존: MBI(2)
--   추가: BBS(2), FAC(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'BBS', 20, '{"riskLevel":"high"}', '2026-01-10 09:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'BBS', 28, '{"riskLevel":"medium"}', '2026-02-03 09:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'FAC', 1, '{"notes":"지속적 보조 필요"}', '2026-01-10 10:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'FAC', 2, '{"notes":"간헐적 보조"}', '2026-02-03 10:00:00+09'),
-- MMT: 상지 정상(5), 하지 양측 약화
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":5},"elbow_flexor_extensor":{"lt":5,"rt":5},"wrist_flexor_extensor":{"lt":5,"rt":5},"hip_flexor":{"lt":2,"rt":2},"knee_extensor":{"lt":2,"rt":2},"ankle_dorsiflexor":{"lt":1,"rt":1}}}',
 '2026-01-10 14:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":5},"elbow_flexor_extensor":{"lt":5,"rt":5},"wrist_flexor_extensor":{"lt":5,"rt":5},"hip_flexor":{"lt":3,"rt":3},"knee_extensor":{"lt":3,"rt":3},"ankle_dorsiflexor":{"lt":2,"rt":2}}}',
 '2026-02-03 14:00:00+09'),
-- ROM: 상지 정상, 하지 제한
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":180,"extension":60,"abduction":180},"rt":{"flexion":180,"extension":60,"abduction":180}},"knee":{"lt":{"flexion":90,"extension":-10},"rt":{"flexion":88,"extension":-12}},"hip":{"lt":{"flexion":80,"extension":10,"abduction":22},"rt":{"flexion":78,"extension":8,"abduction":20}}}}',
 '2026-01-10 15:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":180,"extension":60,"abduction":180},"rt":{"flexion":180,"extension":60,"abduction":180}},"knee":{"lt":{"flexion":105,"extension":-5},"rt":{"flexion":102,"extension":-5}},"hip":{"lt":{"flexion":95,"extension":15,"abduction":30},"rt":{"flexion":92,"extension":12,"abduction":28}}}}',
 '2026-02-03 15:00:00+09'),
-- HandFunction: 상지 거의 정상
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":30,"rightTotalScore":30,"scores":{"grasp":{"left":4,"right":4},"grip":{"left":4,"right":4},"lateral_pinch":{"left":4,"right":4},"tip_pinch":{"left":4,"right":4},"cylinder":{"left":4,"right":4},"sphere":{"left":4,"right":4},"hook":{"left":3,"right":3},"intrinsic_plus":{"left":3,"right":3}}}',
 '2026-01-10 16:00:00+09'),
('a0000001-0000-0000-0000-000000000009', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":31,"rightTotalScore":31,"scores":{"grasp":{"left":4,"right":4},"grip":{"left":4,"right":4},"lateral_pinch":{"left":4,"right":4},"tip_pinch":{"left":4,"right":4},"cylinder":{"left":4,"right":4},"sphere":{"left":4,"right":4},"hook":{"left":4,"right":4},"intrinsic_plus":{"left":3,"right":3}}}',
 '2026-02-03 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자10: 송미란 (a0000001-...10)
--   진단: Rt. PCA infarction, Lt. hemiparesis
--   기존: BBS(1), FAC(1)
--   추가: BBS(1), FAC(1) 2회차 + MBI(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'BBS', 26, '{"riskLevel":"medium"}', '2026-02-03 09:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'FAC', 2, '{"notes":"간헐적 보조"}', '2026-02-03 10:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'MBI', 35, '{}', '2026-01-15 11:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'MBI', 48, '{}', '2026-02-03 11:00:00+09'),
-- MMT: Lt측 약함
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":3,"rt":5},"elbow_flexor_extensor":{"lt":3,"rt":5},"wrist_flexor_extensor":{"lt":2,"rt":5},"hip_flexor":{"lt":3,"rt":5},"knee_extensor":{"lt":3,"rt":5},"ankle_dorsiflexor":{"lt":2,"rt":5}}}',
 '2026-01-15 14:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":5},"elbow_flexor_extensor":{"lt":4,"rt":5},"wrist_flexor_extensor":{"lt":3,"rt":5},"hip_flexor":{"lt":4,"rt":5},"knee_extensor":{"lt":4,"rt":5},"ankle_dorsiflexor":{"lt":3,"rt":5}}}',
 '2026-02-03 14:00:00+09'),
-- ROM
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":120,"extension":28,"abduction":100},"rt":{"flexion":175,"extension":55,"abduction":175}},"knee":{"lt":{"flexion":95,"extension":-8},"rt":{"flexion":130,"extension":0}},"hip":{"lt":{"flexion":82,"extension":10,"abduction":22},"rt":{"flexion":115,"extension":25,"abduction":40}}}}',
 '2026-01-15 15:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":145,"extension":38,"abduction":125},"rt":{"flexion":178,"extension":58,"abduction":178}},"knee":{"lt":{"flexion":112,"extension":-3},"rt":{"flexion":132,"extension":0}},"hip":{"lt":{"flexion":95,"extension":15,"abduction":30},"rt":{"flexion":118,"extension":28,"abduction":42}}}}',
 '2026-02-03 15:00:00+09'),
-- HandFunction: Lt측 약함
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":10,"rightTotalScore":28,"scores":{"grasp":{"left":1,"right":4},"grip":{"left":1,"right":4},"lateral_pinch":{"left":1,"right":4},"tip_pinch":{"left":2,"right":4},"cylinder":{"left":1,"right":3},"sphere":{"left":2,"right":3},"hook":{"left":1,"right":3},"intrinsic_plus":{"left":1,"right":3}}}',
 '2026-01-15 16:00:00+09'),
('a0000001-0000-0000-0000-000000000010', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":17,"rightTotalScore":30,"scores":{"grasp":{"left":2,"right":4},"grip":{"left":2,"right":4},"lateral_pinch":{"left":2,"right":4},"tip_pinch":{"left":3,"right":4},"cylinder":{"left":2,"right":4},"sphere":{"left":2,"right":4},"hook":{"left":2,"right":3},"intrinsic_plus":{"left":2,"right":3}}}',
 '2026-02-03 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자11: 임태준 (a0000001-...11)
--   진단: C6 incomplete SCI, tetraparesis, power wheelchair
--   기존: MBI(2)
--   추가: BBS(2), FAC(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'BBS', 8, '{"riskLevel":"high"}', '2025-12-05 09:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'BBS', 14, '{"riskLevel":"high"}', '2026-01-15 09:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'FAC', 0, '{"notes":"보행불능, 전동 휠체어 사용"}', '2025-12-05 10:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'FAC', 1, '{"notes":"지속적 보조 + 보조기구 필요"}', '2026-01-15 10:00:00+09'),
-- MMT: C6 SCI → 양측 상하지 약화 (상지 > 하지, C6 이하 약함)
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":4},"elbow_flexor_extensor":{"lt":3,"rt":3},"wrist_flexor_extensor":{"lt":1,"rt":1},"hip_flexor":{"lt":1,"rt":1},"knee_extensor":{"lt":1,"rt":1},"ankle_dorsiflexor":{"lt":0,"rt":0}}}',
 '2025-12-05 14:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":4},"elbow_flexor_extensor":{"lt":4,"rt":4},"wrist_flexor_extensor":{"lt":2,"rt":2},"hip_flexor":{"lt":2,"rt":2},"knee_extensor":{"lt":2,"rt":2},"ankle_dorsiflexor":{"lt":1,"rt":1}}}',
 '2026-01-15 14:00:00+09'),
-- ROM: 상지 부분제한, 하지 심한 제한
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":150,"extension":38,"abduction":140},"rt":{"flexion":148,"extension":35,"abduction":138}},"knee":{"lt":{"flexion":70,"extension":-15},"rt":{"flexion":68,"extension":-18}},"hip":{"lt":{"flexion":60,"extension":5,"abduction":15},"rt":{"flexion":58,"extension":5,"abduction":12}}}}',
 '2025-12-05 15:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":158,"extension":42,"abduction":150},"rt":{"flexion":155,"extension":40,"abduction":148}},"knee":{"lt":{"flexion":85,"extension":-10},"rt":{"flexion":82,"extension":-12}},"hip":{"lt":{"flexion":72,"extension":8,"abduction":20},"rt":{"flexion":70,"extension":8,"abduction":18}}}}',
 '2026-01-15 15:00:00+09'),
-- HandFunction: C6 SCI → 파악력 심한 저하
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":8,"rightTotalScore":7,"scores":{"grasp":{"left":1,"right":1},"grip":{"left":1,"right":1},"lateral_pinch":{"left":1,"right":1},"tip_pinch":{"left":1,"right":1},"cylinder":{"left":1,"right":1},"sphere":{"left":1,"right":1},"hook":{"left":1,"right":0},"intrinsic_plus":{"left":1,"right":1}}}',
 '2025-12-05 16:00:00+09'),
('a0000001-0000-0000-0000-000000000011', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":12,"rightTotalScore":11,"scores":{"grasp":{"left":2,"right":2},"grip":{"left":2,"right":1},"lateral_pinch":{"left":1,"right":1},"tip_pinch":{"left":2,"right":2},"cylinder":{"left":1,"right":1},"sphere":{"left":2,"right":2},"hook":{"left":1,"right":1},"intrinsic_plus":{"left":1,"right":1}}}',
 '2026-01-15 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자12: 배영희 (a0000001-...12)
--   진단: Lt. MCA infarction, Rt. hemiplegia, 골다공증
--   기존: BBS(1), FAC(1)
--   추가: BBS(1), FAC(1) 2회차 + MBI(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'BBS', 22, '{"riskLevel":"medium"}', '2026-02-07 09:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'FAC', 1, '{"notes":"지속적 보조 필요"}', '2026-02-07 10:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'MBI', 32, '{}', '2026-01-28 11:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'MBI', 42, '{}', '2026-02-07 11:00:00+09'),
-- MMT: Rt측 약함
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":2},"elbow_flexor_extensor":{"lt":5,"rt":2},"wrist_flexor_extensor":{"lt":5,"rt":1},"hip_flexor":{"lt":5,"rt":2},"knee_extensor":{"lt":5,"rt":2},"ankle_dorsiflexor":{"lt":5,"rt":1}}}',
 '2026-01-28 14:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":5,"rt":3},"elbow_flexor_extensor":{"lt":5,"rt":3},"wrist_flexor_extensor":{"lt":5,"rt":2},"hip_flexor":{"lt":5,"rt":3},"knee_extensor":{"lt":5,"rt":3},"ankle_dorsiflexor":{"lt":5,"rt":2}}}',
 '2026-02-07 14:00:00+09'),
-- ROM: Rt측 제한
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":170,"extension":50,"abduction":168},"rt":{"flexion":100,"extension":20,"abduction":85}},"knee":{"lt":{"flexion":128,"extension":0},"rt":{"flexion":80,"extension":-12}},"hip":{"lt":{"flexion":112,"extension":22,"abduction":38},"rt":{"flexion":68,"extension":5,"abduction":15}}}}',
 '2026-01-28 15:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":175,"extension":55,"abduction":172},"rt":{"flexion":125,"extension":30,"abduction":108}},"knee":{"lt":{"flexion":130,"extension":0},"rt":{"flexion":98,"extension":-5}},"hip":{"lt":{"flexion":115,"extension":25,"abduction":40},"rt":{"flexion":82,"extension":10,"abduction":22}}}}',
 '2026-02-07 15:00:00+09'),
-- HandFunction: Rt측 약함
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":28,"rightTotalScore":6,"scores":{"grasp":{"left":4,"right":1},"grip":{"left":4,"right":1},"lateral_pinch":{"left":3,"right":1},"tip_pinch":{"left":4,"right":1},"cylinder":{"left":4,"right":0},"sphere":{"left":3,"right":1},"hook":{"left":3,"right":0},"intrinsic_plus":{"left":3,"right":1}}}',
 '2026-01-28 16:00:00+09'),
('a0000001-0000-0000-0000-000000000012', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":29,"rightTotalScore":12,"scores":{"grasp":{"left":4,"right":2},"grip":{"left":4,"right":2},"lateral_pinch":{"left":4,"right":1},"tip_pinch":{"left":4,"right":2},"cylinder":{"left":4,"right":1},"sphere":{"left":3,"right":2},"hook":{"left":3,"right":1},"intrinsic_plus":{"left":3,"right":1}}}',
 '2026-02-07 16:00:00+09');

-- ─────────────────────────────────────────────────────────────
-- ▸ 환자13: 조현우 (a0000001-...13)
--   진단: Rt. MCA infarction, Lt. hemiplegia
--   기존: BBS(2), FAC(1)
--   추가: FAC(1) 2회차 + MBI(2), MMT(2), ROM(2), HandFunction(2)
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'FAC', 3, '{"notes":"감독 하 보행"}', '2026-02-03 10:00:00+09'),
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'MBI', 42, '{}', '2026-01-20 11:00:00+09'),
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'MBI', 56, '{}', '2026-02-03 11:00:00+09'),
-- MMT: Lt측 약함
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":3,"rt":5},"elbow_flexor_extensor":{"lt":3,"rt":5},"wrist_flexor_extensor":{"lt":2,"rt":5},"hip_flexor":{"lt":3,"rt":5},"knee_extensor":{"lt":3,"rt":5},"ankle_dorsiflexor":{"lt":2,"rt":5}}}',
 '2026-01-20 14:00:00+09'),
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'MMT', NULL,
 '{"scores":{"shoulder_flexor":{"lt":4,"rt":5},"elbow_flexor_extensor":{"lt":4,"rt":5},"wrist_flexor_extensor":{"lt":3,"rt":5},"hip_flexor":{"lt":4,"rt":5},"knee_extensor":{"lt":4,"rt":5},"ankle_dorsiflexor":{"lt":3,"rt":5}}}',
 '2026-02-03 14:00:00+09'),
-- ROM: Lt측 제한
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":125,"extension":30,"abduction":105},"rt":{"flexion":178,"extension":58,"abduction":178}},"knee":{"lt":{"flexion":95,"extension":-8},"rt":{"flexion":132,"extension":0}},"hip":{"lt":{"flexion":82,"extension":10,"abduction":22},"rt":{"flexion":118,"extension":28,"abduction":42}}}}',
 '2026-01-20 15:00:00+09'),
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'ROM', NULL,
 '{"scores":{"shoulder":{"lt":{"flexion":150,"extension":42,"abduction":135},"rt":{"flexion":180,"extension":60,"abduction":180}},"knee":{"lt":{"flexion":115,"extension":-3},"rt":{"flexion":135,"extension":0}},"hip":{"lt":{"flexion":98,"extension":15,"abduction":30},"rt":{"flexion":120,"extension":30,"abduction":45}}}}',
 '2026-02-03 15:00:00+09'),
-- HandFunction: Lt측 약함
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":10,"rightTotalScore":30,"scores":{"grasp":{"left":1,"right":4},"grip":{"left":1,"right":4},"lateral_pinch":{"left":2,"right":4},"tip_pinch":{"left":2,"right":4},"cylinder":{"left":1,"right":4},"sphere":{"left":1,"right":4},"hook":{"left":1,"right":3},"intrinsic_plus":{"left":1,"right":3}}}',
 '2026-01-20 16:00:00+09'),
('a0000001-0000-0000-0000-000000000013', (SELECT id FROM therapists LIMIT 1), 'HandFunction', NULL,
 '{"leftTotalScore":18,"rightTotalScore":31,"scores":{"grasp":{"left":3,"right":4},"grip":{"left":2,"right":4},"lateral_pinch":{"left":2,"right":4},"tip_pinch":{"left":3,"right":4},"cylinder":{"left":2,"right":4},"sphere":{"left":2,"right":4},"hook":{"left":2,"right":3},"intrinsic_plus":{"left":2,"right":4}}}',
 '2026-02-03 16:00:00+09');
