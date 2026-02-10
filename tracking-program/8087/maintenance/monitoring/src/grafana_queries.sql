(select
  p.name as `Project`,
  `meter` as `Device type`,
  (select count(*) from meter m where m.project = p.id) as `Total`,
  (select count(*) from meter m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) > 15*60*1000) as `OK`,
  (select count(*) from meter m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) <= 15*60*1000) as `Lagging`
from project p having Total > 0)
union
(select
  p.name as `Project`,
  `repeater` as `Device type`,
  (select count(*) from repeater m where m.project = p.id) as `Total`,
  (select count(*) from repeater m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) > 15*60*1000) as `OK`,
  (select count(*) from repeater m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) <= 15*60*1000) as `Lagging`
from project p having Total > 0)
union
(select
  p.name as `Project`,
  `switch` as `Device type`,
  (select count(*) from switch m where m.project = p.id) as `Total`,
  (select count(*) from switch m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) > 15*60*1000) as `OK`,
  (select count(*) from switch m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) <= 15*60*1000) as `Lagging`
from project p having Total > 0)
union
(select
  p.name as `Project`,
  `gateway` as `Device type`,
  (select count(*) from gateway m where m.project = p.id) as `Total`,
  (select count(*) from gateway m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) > 15*60*1000) as `OK`,
  (select count(*) from gateway m where m.project = p.id and (unix_timestamp()*1000 - m.lastCommunicatedAt) <= 15*60*1000) as `Lagging`
from project p having Total > 0)
;

select
  t.proj as Project,
  t.sdown + t.gdown + t.mdown + t.rdown as `Total Down`,
  -- t.sok + t.sdown + t.gok + t.gdown + t.mok + t.mdown + t.rok + t.rdown as Total,
  t.sok as `Switches OK`,
  t.sdown as `Switches Down`,
  t.gok as `Gateways OK`,
  t.gdown as `Gateways Down`,
  t.mok as `Meters OK`,
  t.mdown as `Meters Down`,
  t.rok as `Repeaters OK`,
  t.rdown as `Repeaters Down`
from (
  select
    p.name as proj,
    (select count(*) from switch s where s.project = p.id and s.isDeleted = 0 and (unix_timestamp()*1000 - s.lastCommunicatedAt) <= 15*60*1000) as sok,
    (select count(*) from switch s where s.project = p.id and s.isDeleted = 0 and (unix_timestamp()*1000 - s.lastCommunicatedAt) > 15*60*1000) as sdown,
    (select count(*) from gateway g where g.project = p.id and g.isDeleted = 0 and (unix_timestamp()*1000 - g.lastCommunicatedAt) <= 15*60*1000) as gok,
    (select count(*) from gateway g where g.project = p.id and g.isDeleted = 0 and (unix_timestamp()*1000 - g.lastCommunicatedAt) > 15*60*1000) as gdown,
    (select count(*) from meter m where m.project = p.id and m.isDeleted = 0 and (unix_timestamp()*1000 - m.lastCommunicatedAt) <= 15*60*1000) as mok,
    (select count(*) from meter m where m.project = p.id and m.isDeleted = 0 and (unix_timestamp()*1000 - m.lastCommunicatedAt) > 15*60*1000) as mdown,
    (select count(*) from repeater r where r.project = p.id and r.isDeleted = 0 and (unix_timestamp()*1000 - r.lastCommunicatedAt) <= 15*60*1000) as rok,
    (select count(*) from repeater r where r.project = p.id and r.isDeleted = 0 and (unix_timestamp()*1000 - r.lastCommunicatedAt) > 15*60*1000) as rdown
  from project p
  where p.isDeleted = 0
) as t
-- having Total > 0