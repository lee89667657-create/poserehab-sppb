-- ============================================================
-- 강지영 환자 추가 더미 데이터
-- Supabase SQL Editor에서 실행하세요
-- 기존 강지영 데이터 삭제 후 재삽입
-- ============================================================

-- 기존 강지영 평가 데이터 삭제
DELETE FROM assessments WHERE patient_id = 'a0000001-0000-0000-0000-000000000008';

-- 강지영: BBS 3회, FAC 3회, MBI 3회, MMT 3회, ROM 3회, HandFunction 3회
INSERT INTO assessments (patient_id, therapist_id, assessment_type, score, details, assessed_at) VALUES

-- BBS: 27 → 34 → 41 (점진 개선)
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'BBS', 27, '{"scores":{"1":2,"2":2,"3":2,"4":1,"5":2,"6":2,"7":2,"8":2,"9":2,"10":2,"11":1,"12":2,"13":2,"14":1},"riskLevel":"medium"}', '2026-01-02 09:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'BBS', 34, '{"scores":{"1":3,"2":2,"3":3,"4":2,"5":2,"6":3,"7":2,"8":3,"9":2,"10":3,"11":2,"12":2,"13":2,"14":2},"riskLevel":"medium"}', '2026-02-02 09:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'BBS', 41, '{"scores":{"1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3,"10":3,"11":2,"12":3,"13":3,"14":2},"riskLevel":"low"}', '2026-03-02 09:00:00+09'),

-- FAC: 1 → 2 → 3
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'FAC', 1, '{"notes":"지속적 보조 필요, 우측 편마비"}', '2026-01-02 10:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'FAC', 2, '{"notes":"간헐적 보조, 균형 개선 중"}', '2026-02-02 10:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'FAC', 3, '{"notes":"감독 하 보행 가능, 계단 보조 필요"}', '2026-03-02 10:00:00+09'),

-- MBI: 50 → 60 → 72 (항목별 상세 점수 포함)
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MBI', 50, '{"scores":{"grooming":1,"bathing":1,"eating":5,"toilet":5,"stairs":2,"dressing":5,"bowel":5,"bladder":8,"walking":8,"wheelchair":0,"transfer":10}}', '2026-01-02 11:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MBI', 60, '{"scores":{"grooming":3,"bathing":1,"eating":8,"toilet":5,"stairs":2,"dressing":5,"bowel":8,"bladder":8,"walking":8,"wheelchair":0,"transfer":12}}', '2026-02-02 11:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MBI', 72, '{"scores":{"grooming":3,"bathing":3,"eating":8,"toilet":8,"stairs":5,"dressing":8,"bowel":8,"bladder":8,"walking":10,"wheelchair":0,"transfer":12}}', '2026-03-02 11:00:00+09'),

-- MMT: 3회차 (Rt. hemiplegia → Rt측 약함, 점진 개선)
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MMT', NULL, '{"scores":{"shoulder_flexor":{"lt":5,"rt":2},"elbow_flexor_extensor":{"lt":5,"rt":2},"wrist_flexor_extensor":{"lt":5,"rt":1},"hip_flexor":{"lt":5,"rt":3},"knee_extensor":{"lt":5,"rt":3},"ankle_dorsiflexor":{"lt":5,"rt":2}}}', '2026-01-02 14:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MMT', NULL, '{"scores":{"shoulder_flexor":{"lt":5,"rt":3},"elbow_flexor_extensor":{"lt":5,"rt":3},"wrist_flexor_extensor":{"lt":5,"rt":2},"hip_flexor":{"lt":5,"rt":4},"knee_extensor":{"lt":5,"rt":4},"ankle_dorsiflexor":{"lt":5,"rt":3}}}', '2026-02-02 14:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'MMT', NULL, '{"scores":{"shoulder_flexor":{"lt":5,"rt":4},"elbow_flexor_extensor":{"lt":5,"rt":4},"wrist_flexor_extensor":{"lt":5,"rt":3},"hip_flexor":{"lt":5,"rt":4},"knee_extensor":{"lt":5,"rt":5},"ankle_dorsiflexor":{"lt":5,"rt":4}}}', '2026-03-02 14:00:00+09'),

-- ROM: 3회차 (어깨/무릎/고관절, Lt/Rt 좌우 각도)
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'ROM', NULL, '{"scores":{"shoulder":{"lt":{"flexion":170,"extension":50,"abduction":170},"rt":{"flexion":120,"extension":30,"abduction":100}},"knee":{"lt":{"flexion":130,"extension":0},"rt":{"flexion":90,"extension":-10}},"hip":{"lt":{"flexion":115,"extension":25,"abduction":40},"rt":{"flexion":80,"extension":10,"abduction":25}}}}', '2026-01-02 15:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'ROM', NULL, '{"scores":{"shoulder":{"lt":{"flexion":175,"extension":55,"abduction":175},"rt":{"flexion":140,"extension":38,"abduction":120}},"knee":{"lt":{"flexion":130,"extension":0},"rt":{"flexion":110,"extension":-5}},"hip":{"lt":{"flexion":118,"extension":28,"abduction":42},"rt":{"flexion":95,"extension":15,"abduction":30}}}}', '2026-02-02 15:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'ROM', NULL, '{"scores":{"shoulder":{"lt":{"flexion":178,"extension":58,"abduction":178},"rt":{"flexion":155,"extension":45,"abduction":140}},"knee":{"lt":{"flexion":135,"extension":0},"rt":{"flexion":120,"extension":0}},"hip":{"lt":{"flexion":120,"extension":28,"abduction":44},"rt":{"flexion":108,"extension":20,"abduction":35}}}}', '2026-03-02 15:00:00+09'),

-- Hand Function: 3회차 (각 32점 만점, Rt측 약함 → 점진 개선)
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'HandFunction', NULL, '{"leftTotalScore":28,"rightTotalScore":10,"scores":{"grasp":{"left":4,"right":1},"grip":{"left":4,"right":1},"lateral_pinch":{"left":4,"right":1},"tip_pinch":{"left":4,"right":2},"cylinder":{"left":4,"right":1},"sphere":{"left":4,"right":2},"hook":{"left":2,"right":1},"intrinsic_plus":{"left":2,"right":1}}}', '2026-01-02 16:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'HandFunction', NULL, '{"leftTotalScore":30,"rightTotalScore":16,"scores":{"grasp":{"left":4,"right":2},"grip":{"left":4,"right":2},"lateral_pinch":{"left":4,"right":2},"tip_pinch":{"left":4,"right":3},"cylinder":{"left":4,"right":2},"sphere":{"left":4,"right":2},"hook":{"left":3,"right":1},"intrinsic_plus":{"left":3,"right":2}}}', '2026-02-02 16:00:00+09'),
  ('a0000001-0000-0000-0000-000000000008', '2cfd540e-9ad3-47f0-8f4b-8c5dadda6836', 'HandFunction', NULL, '{"leftTotalScore":31,"rightTotalScore":21,"scores":{"grasp":{"left":4,"right":3},"grip":{"left":4,"right":3},"lateral_pinch":{"left":4,"right":3},"tip_pinch":{"left":4,"right":3},"cylinder":{"left":4,"right":3},"sphere":{"left":4,"right":3},"hook":{"left":3,"right":2},"intrinsic_plus":{"left":4,"right":1}}}', '2026-03-02 16:00:00+09');
