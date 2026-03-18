/* eslint-disable */

// @ts-nocheck

// Extended to include all social methods.

import { IDL } from '@icp-sdk/core/candid';

export const _CaffeineStorageCreateCertificateResult = IDL.Record({
  'method' : IDL.Text,
  'blob_hash' : IDL.Text,
});
export const _CaffeineStorageRefillInformation = IDL.Record({
  'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
});
export const _CaffeineStorageRefillResult = IDL.Record({
  'success' : IDL.Opt(IDL.Bool),
  'topped_up_amount' : IDL.Opt(IDL.Nat),
});
export const Time = IDL.Int;
export const ExternalBlob = IDL.Vec(IDL.Nat8);
export const ArtistPageResponse = IDL.Record({
  'bio' : IDL.Text,
  'postCount' : IDL.Nat,
  'principal' : IDL.Principal,
  'username' : IDL.Text,
  'createdAt' : Time,
  'tier' : IDL.Text,
  'bandName' : IDL.Text,
  'website' : IDL.Opt(IDL.Text),
  'updatedAt' : Time,
  'genre' : IDL.Text,
  'musicLinks' : IDL.Vec(IDL.Text),
  'followerCount' : IDL.Nat,
  'headerImageHash' : IDL.Opt(ExternalBlob),
  'followingCount' : IDL.Nat,
  'isFollowedByCurrentUser' : IDL.Bool,
  'profilePictureHash' : IDL.Opt(ExternalBlob),
  'location' : IDL.Opt(IDL.Text),
});
export const UserProfile = IDL.Record({
  'bio' : IDL.Text,
  'username' : IDL.Text,
  'displayName' : IDL.Text,
  'createdAt' : Time,
  'website' : IDL.Opt(IDL.Text),
  'updatedAt' : Time,
  'headerImageHash' : IDL.Opt(ExternalBlob),
  'profilePictureHash' : IDL.Opt(ExternalBlob),
  'location' : IDL.Opt(IDL.Text),
});
export const UserProfileResponse = IDL.Record({
  'principal' : IDL.Principal,
  'username' : IDL.Text,
  'displayName' : IDL.Text,
  'bio' : IDL.Text,
  'profilePictureHash' : IDL.Opt(ExternalBlob),
  'headerImageHash' : IDL.Opt(ExternalBlob),
  'location' : IDL.Opt(IDL.Text),
  'website' : IDL.Opt(IDL.Text),
  'createdAt' : Time,
  'updatedAt' : Time,
  'followersCount' : IDL.Nat,
  'followingCount' : IDL.Nat,
  'postsCount' : IDL.Nat,
  'isFollowedByCurrentUser' : IDL.Bool,
  'isBlockedByCurrentUser' : IDL.Bool,
  'isMutedByCurrentUser' : IDL.Bool,
});
export const AuthorIdentity = IDL.Variant({
  'fan' : IDL.Null,
  'artist' : IDL.Null,
});
export const PostType = IDL.Variant({
  'original' : IDL.Null,
  'reply' : IDL.Nat,
  'repost' : IDL.Nat,
  'quote' : IDL.Nat,
});
export const PostResponse = IDL.Record({
  'id' : IDL.Nat,
  'author' : IDL.Principal,
  'authorIdentity' : AuthorIdentity,
  'authorUsername' : IDL.Text,
  'authorDisplayName' : IDL.Text,
  'authorProfilePictureHash' : IDL.Opt(ExternalBlob),
  'text' : IDL.Text,
  'mediaHash' : IDL.Opt(ExternalBlob),
  'mediaType' : IDL.Opt(IDL.Text),
  'postType' : PostType,
  'createdAt' : Time,
  'editedAt' : IDL.Opt(Time),
  'likeCount' : IDL.Nat,
  'replyCount' : IDL.Nat,
  'repostCount' : IDL.Nat,
  'isLikedByCurrentUser' : IDL.Bool,
  'isRepostedByCurrentUser' : IDL.Bool,
});
export const PaginatedPosts = IDL.Record({
  'posts' : IDL.Vec(PostResponse),
  'nextCursor' : IDL.Opt(IDL.Nat),
  'hasMore' : IDL.Bool,
});
export const FollowUserResponse = IDL.Record({
  'principal' : IDL.Principal,
  'username' : IDL.Text,
  'displayName' : IDL.Text,
  'profilePictureHash' : IDL.Opt(ExternalBlob),
});
export const PaginatedFollows = IDL.Record({
  'users' : IDL.Vec(FollowUserResponse),
  'nextOffset' : IDL.Opt(IDL.Nat),
  'hasMore' : IDL.Bool,
});
export const NotificationType = IDL.Variant({
  'like' : IDL.Nat,
  'reply' : IDL.Nat,
  'mention' : IDL.Nat,
  'follow' : IDL.Null,
  'repost' : IDL.Nat,
  'quote' : IDL.Nat,
});
export const Notification = IDL.Record({
  'id' : IDL.Nat,
  'notificationType' : NotificationType,
  'actorPrincipal' : IDL.Principal,
  'actorUsername' : IDL.Text,
  'createdAt' : Time,
  'isRead' : IDL.Bool,
});
export const PaginatedNotifications = IDL.Record({
  'notifications' : IDL.Vec(Notification),
  'nextCursor' : IDL.Opt(IDL.Nat),
  'hasMore' : IDL.Bool,
});
export const TrendingHashtag = IDL.Record({
  'tag' : IDL.Text,
  'count' : IDL.Nat,
});

const _socialMethods = {
  'createPost' : IDL.Func(
      [IDL.Text, IDL.Opt(ExternalBlob), IDL.Opt(IDL.Text), PostType, AuthorIdentity],
      [IDL.Nat],
      [],
    ),
  'editPost' : IDL.Func([IDL.Nat, IDL.Text], [], []),
  'deletePost' : IDL.Func([IDL.Nat], [], []),
  'getPost' : IDL.Func([IDL.Nat], [IDL.Opt(PostResponse)], ['query']),
  'getFeed' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getArtistFeed' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getExplorePosts' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getUserPosts' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getArtistPosts' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getPostReplies' : IDL.Func([IDL.Nat, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getProfileByPrincipal' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfileResponse)], ['query']),
  'getProfileByUsername' : IDL.Func([IDL.Text], [IDL.Opt(UserProfileResponse)], ['query']),
  'getFollowers' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
  'getFollowing' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
  'getArtistFollowers' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
  'getArtistFollowing' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
  'followUser' : IDL.Func([IDL.Principal], [], []),
  'unfollowUser' : IDL.Func([IDL.Principal], [], []),
  'followArtist' : IDL.Func([IDL.Principal], [], []),
  'unfollowArtist' : IDL.Func([IDL.Principal], [], []),
  'blockUser' : IDL.Func([IDL.Principal], [], []),
  'unblockUser' : IDL.Func([IDL.Principal], [], []),
  'muteUser' : IDL.Func([IDL.Principal], [], []),
  'unmuteUser' : IDL.Func([IDL.Principal], [], []),
  'likePost' : IDL.Func([IDL.Nat], [], []),
  'unlikePost' : IDL.Func([IDL.Nat], [], []),
  'getNotifications' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedNotifications], ['query']),
  'getUnreadNotificationCount' : IDL.Func([], [IDL.Nat], ['query']),
  'markNotificationRead' : IDL.Func([IDL.Nat], [], []),
  'markAllNotificationsRead' : IDL.Func([], [], []),
  'searchPosts' : IDL.Func([IDL.Text, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'searchUsers' : IDL.Func([IDL.Text], [IDL.Vec(UserProfileResponse)], ['query']),
  'searchArtists' : IDL.Func([IDL.Text], [IDL.Vec(ArtistPageResponse)], ['query']),
  'getPostsByHashtag' : IDL.Func([IDL.Text, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
  'getTrendingHashtags' : IDL.Func([IDL.Nat], [IDL.Vec(TrendingHashtag)], ['query']),
  'getBlockedUsers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
  'getMutedUsers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
};

export const idlService = IDL.Service({
  '_caffeineStorageBlobIsLive' : IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Bool],
      ['query'],
    ),
  '_caffeineStorageBlobsToDelete' : IDL.Func(
      [],
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      ['query'],
    ),
  '_caffeineStorageConfirmBlobDeletion' : IDL.Func(
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      [],
      [],
    ),
  '_caffeineStorageCreateCertificate' : IDL.Func(
      [IDL.Text],
      [_CaffeineStorageCreateCertificateResult],
      [],
    ),
  '_caffeineStorageRefillCashier' : IDL.Func(
      [IDL.Opt(_CaffeineStorageRefillInformation)],
      [_CaffeineStorageRefillResult],
      [],
    ),
  '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
  'checkUsernameAvailability' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  'createOrUpdateArtistPage' : IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Vec(IDL.Text),
        IDL.Opt(IDL.Text),
        IDL.Opt(IDL.Text),
        IDL.Opt(IDL.Text),
      ],
      [],
      [],
    ),
  'getArtistPage' : IDL.Func([], [IDL.Opt(ArtistPageResponse)], ['query']),
  'getArtistPageByPrincipal' : IDL.Func(
      [IDL.Principal],
      [IDL.Opt(ArtistPageResponse)],
      ['query'],
    ),
  'getArtistPageByUsername' : IDL.Func([IDL.Text], [IDL.Opt(ArtistPageResponse)], ['query']),
  'getPrincipalByUsername' : IDL.Func(
      [IDL.Text],
      [IDL.Opt(IDL.Principal)],
      ['query'],
    ),
  'getProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'setProfile' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
      [],
      [],
    ),
  'updateArtistHeaderImage' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
  'updateArtistProfilePicture' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
  'updateHeaderImage' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
  'updateProfilePicture' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
  ..._socialMethods,
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const _CaffeineStorageCreateCertificateResult = IDL.Record({
    'method' : IDL.Text,
    'blob_hash' : IDL.Text,
  });
  const _CaffeineStorageRefillInformation = IDL.Record({
    'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
  });
  const _CaffeineStorageRefillResult = IDL.Record({
    'success' : IDL.Opt(IDL.Bool),
    'topped_up_amount' : IDL.Opt(IDL.Nat),
  });
  const Time = IDL.Int;
  const ExternalBlob = IDL.Vec(IDL.Nat8);
  const ArtistPageResponse = IDL.Record({
    'bio' : IDL.Text,
    'postCount' : IDL.Nat,
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'createdAt' : Time,
    'tier' : IDL.Text,
    'bandName' : IDL.Text,
    'website' : IDL.Opt(IDL.Text),
    'updatedAt' : Time,
    'genre' : IDL.Text,
    'musicLinks' : IDL.Vec(IDL.Text),
    'followerCount' : IDL.Nat,
    'headerImageHash' : IDL.Opt(ExternalBlob),
    'followingCount' : IDL.Nat,
    'isFollowedByCurrentUser' : IDL.Bool,
    'profilePictureHash' : IDL.Opt(ExternalBlob),
    'location' : IDL.Opt(IDL.Text),
  });
  const UserProfile = IDL.Record({
    'bio' : IDL.Text,
    'username' : IDL.Text,
    'displayName' : IDL.Text,
    'createdAt' : Time,
    'website' : IDL.Opt(IDL.Text),
    'updatedAt' : Time,
    'headerImageHash' : IDL.Opt(ExternalBlob),
    'profilePictureHash' : IDL.Opt(ExternalBlob),
    'location' : IDL.Opt(IDL.Text),
  });
  const UserProfileResponse = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'displayName' : IDL.Text,
    'bio' : IDL.Text,
    'profilePictureHash' : IDL.Opt(ExternalBlob),
    'headerImageHash' : IDL.Opt(ExternalBlob),
    'location' : IDL.Opt(IDL.Text),
    'website' : IDL.Opt(IDL.Text),
    'createdAt' : Time,
    'updatedAt' : Time,
    'followersCount' : IDL.Nat,
    'followingCount' : IDL.Nat,
    'postsCount' : IDL.Nat,
    'isFollowedByCurrentUser' : IDL.Bool,
    'isBlockedByCurrentUser' : IDL.Bool,
    'isMutedByCurrentUser' : IDL.Bool,
  });
  const AuthorIdentity = IDL.Variant({
    'fan' : IDL.Null,
    'artist' : IDL.Null,
  });
  const PostType = IDL.Variant({
    'original' : IDL.Null,
    'reply' : IDL.Nat,
    'repost' : IDL.Nat,
    'quote' : IDL.Nat,
  });
  const PostResponse = IDL.Record({
    'id' : IDL.Nat,
    'author' : IDL.Principal,
    'authorIdentity' : AuthorIdentity,
    'authorUsername' : IDL.Text,
    'authorDisplayName' : IDL.Text,
    'authorProfilePictureHash' : IDL.Opt(ExternalBlob),
    'text' : IDL.Text,
    'mediaHash' : IDL.Opt(ExternalBlob),
    'mediaType' : IDL.Opt(IDL.Text),
    'postType' : PostType,
    'createdAt' : Time,
    'editedAt' : IDL.Opt(Time),
    'likeCount' : IDL.Nat,
    'replyCount' : IDL.Nat,
    'repostCount' : IDL.Nat,
    'isLikedByCurrentUser' : IDL.Bool,
    'isRepostedByCurrentUser' : IDL.Bool,
  });
  const PaginatedPosts = IDL.Record({
    'posts' : IDL.Vec(PostResponse),
    'nextCursor' : IDL.Opt(IDL.Nat),
    'hasMore' : IDL.Bool,
  });
  const FollowUserResponse = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'displayName' : IDL.Text,
    'profilePictureHash' : IDL.Opt(ExternalBlob),
  });
  const PaginatedFollows = IDL.Record({
    'users' : IDL.Vec(FollowUserResponse),
    'nextOffset' : IDL.Opt(IDL.Nat),
    'hasMore' : IDL.Bool,
  });
  const NotificationType = IDL.Variant({
    'like' : IDL.Nat,
    'reply' : IDL.Nat,
    'mention' : IDL.Nat,
    'follow' : IDL.Null,
    'repost' : IDL.Nat,
    'quote' : IDL.Nat,
  });
  const Notification = IDL.Record({
    'id' : IDL.Nat,
    'notificationType' : NotificationType,
    'actorPrincipal' : IDL.Principal,
    'actorUsername' : IDL.Text,
    'createdAt' : Time,
    'isRead' : IDL.Bool,
  });
  const PaginatedNotifications = IDL.Record({
    'notifications' : IDL.Vec(Notification),
    'nextCursor' : IDL.Opt(IDL.Nat),
    'hasMore' : IDL.Bool,
  });
  const TrendingHashtag = IDL.Record({
    'tag' : IDL.Text,
    'count' : IDL.Nat,
  });
  
  return IDL.Service({
    '_caffeineStorageBlobIsLive' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Bool],
        ['query'],
      ),
    '_caffeineStorageBlobsToDelete' : IDL.Func(
        [],
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        ['query'],
      ),
    '_caffeineStorageConfirmBlobDeletion' : IDL.Func(
        [IDL.Vec(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    '_caffeineStorageCreateCertificate' : IDL.Func(
        [IDL.Text],
        [_CaffeineStorageCreateCertificateResult],
        [],
      ),
    '_caffeineStorageRefillCashier' : IDL.Func(
        [IDL.Opt(_CaffeineStorageRefillInformation)],
        [_CaffeineStorageRefillResult],
        [],
      ),
    '_caffeineStorageUpdateGatewayPrincipals' : IDL.Func([], [], []),
    'checkUsernameAvailability' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'createOrUpdateArtistPage' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
    'getArtistPage' : IDL.Func([], [IDL.Opt(ArtistPageResponse)], ['query']),
    'getArtistPageByPrincipal' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(ArtistPageResponse)],
        ['query'],
      ),
    'getArtistPageByUsername' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(ArtistPageResponse)],
        ['query'],
      ),
    'getPrincipalByUsername' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'getProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'setProfile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'updateArtistHeaderImage' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
    'updateArtistProfilePicture' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
    'updateHeaderImage' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
    'updateProfilePicture' : IDL.Func([IDL.Opt(ExternalBlob)], [], []),
    'createPost' : IDL.Func(
        [IDL.Text, IDL.Opt(ExternalBlob), IDL.Opt(IDL.Text), PostType, AuthorIdentity],
        [IDL.Nat],
        [],
      ),
    'editPost' : IDL.Func([IDL.Nat, IDL.Text], [], []),
    'deletePost' : IDL.Func([IDL.Nat], [], []),
    'getPost' : IDL.Func([IDL.Nat], [IDL.Opt(PostResponse)], ['query']),
    'getFeed' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getArtistFeed' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getExplorePosts' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getUserPosts' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getArtistPosts' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getPostReplies' : IDL.Func([IDL.Nat, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getProfileByPrincipal' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfileResponse)], ['query']),
    'getProfileByUsername' : IDL.Func([IDL.Text], [IDL.Opt(UserProfileResponse)], ['query']),
    'getFollowers' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
    'getFollowing' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
    'getArtistFollowers' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
    'getArtistFollowing' : IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [PaginatedFollows], ['query']),
    'followUser' : IDL.Func([IDL.Principal], [], []),
    'unfollowUser' : IDL.Func([IDL.Principal], [], []),
    'followArtist' : IDL.Func([IDL.Principal], [], []),
    'unfollowArtist' : IDL.Func([IDL.Principal], [], []),
    'blockUser' : IDL.Func([IDL.Principal], [], []),
    'unblockUser' : IDL.Func([IDL.Principal], [], []),
    'muteUser' : IDL.Func([IDL.Principal], [], []),
    'unmuteUser' : IDL.Func([IDL.Principal], [], []),
    'likePost' : IDL.Func([IDL.Nat], [], []),
    'unlikePost' : IDL.Func([IDL.Nat], [], []),
    'getNotifications' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedNotifications], ['query']),
    'getUnreadNotificationCount' : IDL.Func([], [IDL.Nat], ['query']),
    'markNotificationRead' : IDL.Func([IDL.Nat], [], []),
    'markAllNotificationsRead' : IDL.Func([], [], []),
    'searchPosts' : IDL.Func([IDL.Text, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'searchUsers' : IDL.Func([IDL.Text], [IDL.Vec(UserProfileResponse)], ['query']),
    'searchArtists' : IDL.Func([IDL.Text], [IDL.Vec(ArtistPageResponse)], ['query']),
    'getPostsByHashtag' : IDL.Func([IDL.Text, IDL.Opt(IDL.Nat), IDL.Nat], [PaginatedPosts], ['query']),
    'getTrendingHashtags' : IDL.Func([IDL.Nat], [IDL.Vec(TrendingHashtag)], ['query']),
    'getBlockedUsers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getMutedUsers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };