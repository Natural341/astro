// React Query hooks for all social / server-side data. Centralizes caching,
// dedup, optimistic updates and cross-screen cache invalidation so a mutation
// in one screen keeps every other screen in sync automatically.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  discoverUsers,
  getFriends,
  getFriendRequests,
  getBlocked,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getNotifications,
  markAllNotificationsRead,
  getUnreadCount,
  getConversations,
  type DiscoverUser,
  type FriendRequest,
  type FriendUser,
  type FriendshipStatus,
} from '../services/api';

// Query keys in one place — string-prefixed so `['discover']` invalidates every search.
export const qk = {
  friends: ['friends'] as const,
  friendRequests: ['friendRequests'] as const,
  discover: (q: string) => ['discover', q] as const,
  blocked: ['blocked'] as const,
  notifications: ['notifications'] as const,
  unreadCount: ['unreadCount'] as const,
  conversations: ['conversations'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────
export const useFriends = () =>
  useQuery({ queryKey: qk.friends, queryFn: () => getFriends().then((r) => r.data ?? []) });

export const useFriendRequests = () =>
  useQuery({
    queryKey: qk.friendRequests,
    queryFn: () => getFriendRequests().then((r) => r.data ?? []),
  });

export const useDiscover = (query: string) =>
  useQuery({
    queryKey: qk.discover(query),
    queryFn: () => discoverUsers(query).then((r) => r.data ?? []),
  });

export const useBlocked = () =>
  useQuery({ queryKey: qk.blocked, queryFn: () => getBlocked().then((r) => r.data ?? []) });

export const useNotifications = (limit = 50) =>
  useQuery({
    queryKey: qk.notifications,
    queryFn: () => getNotifications(limit).then((r) => r.data ?? []),
  });

export const useUnreadCount = () =>
  useQuery({ queryKey: qk.unreadCount, queryFn: () => getUnreadCount().then((r) => r.count ?? 0) });

export const useConversations = () =>
  useQuery({
    queryKey: qk.conversations,
    queryFn: () => getConversations().then((r) => r.data ?? []),
  });

// ─── Mutations ──────────────────────────────────────────────────────────────────
// All friend actions touch overlapping lists, so they invalidate the whole set on
// settle. Optimistic onMutate keeps the UI instant; invalidation reconciles truth.
export const useSocialMutations = () => {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: qk.friends });
    qc.invalidateQueries({ queryKey: qk.friendRequests });
    qc.invalidateQueries({ queryKey: ['discover'] });
    qc.invalidateQueries({ queryKey: qk.blocked });
    qc.invalidateQueries({ queryKey: qk.notifications });
    qc.invalidateQueries({ queryKey: qk.unreadCount });
  };

  const sendRequest = useMutation({
    mutationFn: (addresseeId: string) => sendFriendRequest(addresseeId),
    onMutate: (addresseeId) => {
      qc.setQueriesData<DiscoverUser[]>({ queryKey: ['discover'] }, (old) =>
        (old ?? []).map((u) =>
          u.id === addresseeId ? { ...u, friendship_status: 'pending_out' as FriendshipStatus } : u,
        ),
      );
    },
    onSettled: invalidateAll,
  });

  const respondRequest = useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondFriendRequest(requestId, accept),
    onMutate: ({ requestId, accept }) => {
      qc.setQueryData<FriendRequest[]>(qk.friendRequests, (old) =>
        (old ?? []).filter((r) => r.request_id !== requestId),
      );
      // Reflect the decision in any discover list that includes this user.
      qc.setQueriesData<DiscoverUser[]>({ queryKey: ['discover'] }, (old) =>
        (old ?? []).map((u) =>
          u.friendship_id === requestId
            ? { ...u, friendship_status: (accept ? 'friends' : 'none') as FriendshipStatus }
            : u,
        ),
      );
    },
    onSettled: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeFriend(userId),
    onMutate: (userId) => {
      qc.setQueryData<FriendUser[]>(qk.friends, (old) => (old ?? []).filter((f) => f.id !== userId));
      qc.setQueriesData<DiscoverUser[]>({ queryKey: ['discover'] }, (old) =>
        (old ?? []).map((u) =>
          u.id === userId ? { ...u, friendship_status: 'none' as FriendshipStatus } : u,
        ),
      );
    },
    onSettled: invalidateAll,
  });

  const block = useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSettled: invalidateAll,
  });

  const unblock = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onMutate: (userId) => {
      qc.setQueryData<FriendUser[]>(qk.blocked, (old) => (old ?? []).filter((b) => b.id !== userId));
    },
    onSettled: invalidateAll,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    // Only clear the badge — leave the visible list highlighted for this viewing.
    onSettled: () => qc.invalidateQueries({ queryKey: qk.unreadCount }),
  });

  return { sendRequest, respondRequest, remove, block, unblock, markAllRead };
};
