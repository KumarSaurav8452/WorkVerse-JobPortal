// WorkVerse — Neo4j Schema Setup (Cypher)
// Run this against your AuraDB instance b63e5150
// URI: neo4j+s://b63e5150.databases.neo4j.io

// =========================================
// CONSTRAINTS (Unique IDs)
// =========================================
CREATE CONSTRAINT candidate_id IF NOT EXISTS
  FOR (c:Candidate) REQUIRE c.candidateId IS UNIQUE;

CREATE CONSTRAINT job_id IF NOT EXISTS
  FOR (j:Job) REQUIRE j.jobId IS UNIQUE;

CREATE CONSTRAINT skill_id IF NOT EXISTS
  FOR (s:Skill) REQUIRE s.skillId IS UNIQUE;

CREATE CONSTRAINT skill_name IF NOT EXISTS
  FOR (s:Skill) REQUIRE s.name IS UNIQUE;

CREATE CONSTRAINT company_id IF NOT EXISTS
  FOR (co:Company) REQUIRE co.companyId IS UNIQUE;

CREATE CONSTRAINT university_id IF NOT EXISTS
  FOR (u:University) REQUIRE u.uniId IS UNIQUE;

CREATE CONSTRAINT location_id IF NOT EXISTS
  FOR (l:Location) REQUIRE l.locId IS UNIQUE;

CREATE CONSTRAINT application_id IF NOT EXISTS
  FOR (a:Application) REQUIRE a.appId IS UNIQUE;

CREATE CONSTRAINT assessment_id IF NOT EXISTS
  FOR (a:Assessment) REQUIRE a.assId IS UNIQUE;

// =========================================
// INDEXES (Performance)
// =========================================
CREATE INDEX candidate_email IF NOT EXISTS
  FOR (c:Candidate) ON (c.email);

CREATE INDEX candidate_location IF NOT EXISTS
  FOR (c:Candidate) ON (c.locationId);

CREATE INDEX candidate_looking IF NOT EXISTS
  FOR (c:Candidate) ON (c.isLooking);

CREATE INDEX job_status_posted IF NOT EXISTS
  FOR (j:Job) ON (j.status, j.postedAt);

CREATE INDEX job_company IF NOT EXISTS
  FOR (j:Job) ON (j.companyId);

CREATE INDEX application_status IF NOT EXISTS
  FOR (a:Application) ON (a.status);

// =========================================
// FULLTEXT INDEXES (Search)
// =========================================
CREATE FULLTEXT INDEX skill_search IF NOT EXISTS
  FOR (n:Skill) ON EACH [n.name, n.category];

CREATE FULLTEXT INDEX job_search IF NOT EXISTS
  FOR (n:Job) ON EACH [n.title, n.description];

CREATE FULLTEXT INDEX candidate_search IF NOT EXISTS
  FOR (n:Candidate) ON EACH [n.name, n.title, n.bio];
