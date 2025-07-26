-- Migração para adicionar campos de geolocalização
-- Execute este script no SQL Editor do Supabase

-- Adicionar campos de latitude e longitude à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance em consultas de proximidade
CREATE INDEX IF NOT EXISTS idx_profiles_latitude ON profiles(latitude);
CREATE INDEX IF NOT EXISTS idx_profiles_longitude ON profiles(longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_location_coords ON profiles(latitude, longitude);

-- Comentários para documentação
COMMENT ON COLUMN profiles.latitude IS 'Latitude da localização do usuário (para cálculos de proximidade)';
COMMENT ON COLUMN profiles.longitude IS 'Longitude da localização do usuário (para cálculos de proximidade)';
COMMENT ON COLUMN profiles.location_updated_at IS 'Timestamp da última atualização da localização';

-- Função para calcular distância entre dois pontos (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Raio da Terra em km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Converter graus para radianos
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    -- Fórmula de Haversine
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar usuários próximos
CREATE OR REPLACE FUNCTION get_nearby_users(
    user_lat DECIMAL, 
    user_lon DECIMAL, 
    max_distance_km INTEGER DEFAULT 50,
    exclude_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    age INTEGER,
    location VARCHAR(200),
    latitude DECIMAL,
    longitude DECIMAL,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.age,
        p.location,
        p.latitude,
        p.longitude,
        calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance_km
    FROM profiles p
    WHERE p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND (exclude_user_id IS NULL OR p.id != exclude_user_id)
      AND calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= max_distance_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar location_updated_at quando latitude/longitude mudarem
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.latitude IS DISTINCT FROM NEW.latitude) OR 
       (OLD.longitude IS DISTINCT FROM NEW.longitude) THEN
        NEW.location_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_timestamp_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_location_timestamp();