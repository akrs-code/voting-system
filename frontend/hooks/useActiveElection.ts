import { useState, useEffect, useCallback } from 'react';
import { electionService } from '../services/electionService';

export const useActiveElection = () => {
  const [activeElection, setActiveElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);
      const data = await electionService.getActive();
      setActiveElection(data || null);
    } catch (error) {
      setActiveElection(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    window.addEventListener('focus', fetchActive);
    return () => window.removeEventListener('focus', fetchActive);
  }, [fetchActive]);

  return { activeElection, loading, refreshActive: fetchActive };
};