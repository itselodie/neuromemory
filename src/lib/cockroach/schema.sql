-- ==============================================================================
-- NeuroMemory — CockroachDB Schema Definition
-- Exact 4-Table Architecture
-- 1. working_memory  : Active conversation buffer (user_id, session_id, role, content, topic_tag, created_at)
-- 2. episodic_memory : Vectorized interaction traces with significance scores
-- 3. semantic_memory : Consolidated knowledge concepts with vector embeddings & reinforcement counts
-- 4. archive_log     : Offloaded cold storage tracking for AWS S3
-- ==============================================================================

-- 1. Working Memory (Active conversation turns, lightweight buffer without vectors)
CREATE TABLE IF NOT EXISTS working_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_id TEXT NOT NULL,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    topic_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- 2. Episodic Memory (Vectorized trace history with significance scoring & decay attributes)
CREATE TABLE IF NOT EXISTS episodic_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    significance_score FLOAT DEFAULT 0.5,
    reinforcement_count INT DEFAULT 0,
    concept_tags TEXT[] DEFAULT '{}',
    promoted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    last_accessed_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Semantic Memory (Consolidated knowledge & concepts with vector search)
CREATE TABLE IF NOT EXISTS semantic_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_id TEXT,
    concept TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    significance_score FLOAT DEFAULT 0.5,
    reinforcement_count INT DEFAULT 0,
    concept_tags TEXT[] DEFAULT '{}',
    source_episodic_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    last_accessed_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Archive Log (Records offloaded cold memories stored in AWS S3)
CREATE TABLE IF NOT EXISTS archive_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_memory_id UUID NOT NULL,
    source_table VARCHAR(64) NOT NULL,
    session_id TEXT,
    s3_object_key TEXT NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Vector Similarity Indexes (IVFFlat Cosine Distance on vector(1536))
CREATE INDEX IF NOT EXISTS idx_episodic_memory_vector ON episodic_memory USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_semantic_memory_vector ON semantic_memory USING ivfflat (embedding vector_cosine_ops);

-- Session & User Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_working_memory_session ON working_memory (session_id);
CREATE INDEX IF NOT EXISTS idx_episodic_memory_session ON episodic_memory (session_id);
CREATE INDEX IF NOT EXISTS idx_semantic_memory_session ON semantic_memory (session_id);
