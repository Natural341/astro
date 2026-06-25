// Live online/offline state. Degrades to "online" if NetInfo is unavailable.
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = (): boolean => {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => unsub();
  }, []);
  return online;
};
