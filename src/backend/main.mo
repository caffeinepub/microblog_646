import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Char "mo:core/Char";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // ── Types ─────────────────────────────────────────────────────────────────

  type UserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    location : ?Text;
    website : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type ArtistPage = {
    username : Text;
    bandName : Text;
    genre : Text;
    bio : Text;
    musicLinks : [Text];
    tier : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    location : ?Text;
    website : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type ArtistPageResponse = {
    principal : Principal;
    username : Text;
    bandName : Text;
    genre : Text;
    bio : Text;
    musicLinks : [Text];
    tier : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    location : ?Text;
    website : ?Text;
    followerCount : Nat;
    followingCount : Nat;
    postCount : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    isFollowedByCurrentUser : Bool;
  };

  type PostType = {
    #original;
    #reply : Nat;
    #repost : Nat;
    #quote : Nat;
  };

  type AuthorIdentity = {
    #fan;
    #artist;
  };

  type Post = {
    id : Nat;
    author : Principal;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    postType : PostType;
    authorIdentity : AuthorIdentity;
    createdAt : Time.Time;
    editedAt : ?Time.Time;
  };

  type PostResponse = {
    id : Nat;
    author : Principal;
    authorIdentity : AuthorIdentity;
    authorUsername : Text;
    authorDisplayName : Text;
    authorProfilePictureHash : ?Storage.ExternalBlob;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    postType : PostType;
    createdAt : Time.Time;
    editedAt : ?Time.Time;
    likeCount : Nat;
    replyCount : Nat;
    repostCount : Nat;
    isLikedByCurrentUser : Bool;
    isRepostedByCurrentUser : Bool;
  };

  type PaginatedPosts = {
    posts : [PostResponse];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  type TrendingHashtag = {
    tag : Text;
    count : Nat;
  };

  type UserProfileResponse = {
    principal : Principal;
    username : Text;
    displayName : Text;
    bio : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    location : ?Text;
    website : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    followersCount : Nat;
    followingCount : Nat;
    postsCount : Nat;
    isFollowedByCurrentUser : Bool;
    isBlockedByCurrentUser : Bool;
    isMutedByCurrentUser : Bool;
  };

  type FollowUserResponse = {
    principal : Principal;
    username : Text;
    displayName : Text;
    profilePictureHash : ?Storage.ExternalBlob;
  };

  type PaginatedFollows = {
    users : [FollowUserResponse];
    nextOffset : ?Nat;
    hasMore : Bool;
  };

  type NotificationType = {
    #like : Nat;
    #reply : Nat;
    #mention : Nat;
    #follow;
    #repost : Nat;
    #quote : Nat;
  };

  type Notification = {
    id : Nat;
    notificationType : NotificationType;
    actorPrincipal : Principal;
    actorUsername : Text;
    createdAt : Time.Time;
    isRead : Bool;
  };

  type PaginatedNotifications = {
    notifications : [Notification];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  // ── Stable State ──────────────────────────────────────────────────────────

  stable var userProfiles : Map.Map<Principal, UserProfile> = Map.empty();
  stable var artistPages : Map.Map<Principal, ArtistPage> = Map.empty();
  stable var usernameToUser : Map.Map<Text, Principal> = Map.empty();
  stable var artistUsernameToArtist : Map.Map<Text, Principal> = Map.empty();
  stable var posts : Map.Map<Nat, Post> = Map.empty();
  stable var userPostCounts : Map.Map<Principal, Nat> = Map.empty();
  stable var artistPostCounts : Map.Map<Principal, Nat> = Map.empty();
  stable var nextPostId : Nat = 0;
  stable var following : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var followers : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var artistFollowing : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var artistFollowers : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var blocks : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var mutes : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  stable var postLikes : Map.Map<Nat, Map.Map<Principal, Bool>> = Map.empty();
  stable var postReplies : Map.Map<Nat, Map.Map<Nat, Bool>> = Map.empty();
  stable var postReposts : Map.Map<Nat, Map.Map<Principal, Bool>> = Map.empty();
  stable var repostIndex : Map.Map<Principal, Map.Map<Nat, Nat>> = Map.empty();
  stable var hashtagIndex : Map.Map<Text, Map.Map<Nat, Bool>> = Map.empty();
  stable var userNotifications : Map.Map<Principal, Map.Map<Nat, Notification>> = Map.empty();
  stable var nextNotificationId : Nat = 0;
  stable var schemaVersion : Nat = 1;

  // ── Constants ─────────────────────────────────────────────────────────────

  let maxPostLength : Nat = 280;
  let editDeleteWindowNanos : Int = 900_000_000_000;
  let maxPostsPerUser : Nat = 10_000;
  let maxNotificationsPerUser : Nat = 50;
  stable var maxPostsPerArtist : Nat = 10_000;
  stable var maxFollowersPerArtist : Nat = 100_000;

  // ── Upgrade Hooks ─────────────────────────────────────────────────────────

  system func preupgrade() {};
  system func postupgrade() { schemaVersion += 1 };

  // ── Helpers ───────────────────────────────────────────────────────────────

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) { Runtime.trap("Not authenticated") };
  };

  func toLower(t : Text) : Text {
    t.map(func(c) {
      let code = c.toNat32();
      if (code >= 65 and code <= 90) { Char.fromNat32(code + 32) } else { c };
    });
  };

  func isValidUsername(username : Text) : Bool {
    let size = username.size();
    if (size < 3 or size > 20) { return false };
    for (c in username.chars()) {
      let code = c.toNat32();
      if (not ((code >= 97 and code <= 122) or (code >= 65 and code <= 90) or
               (code >= 48 and code <= 57) or code == 95)) { return false };
    };
    true;
  };

  func normalizeWebsite(url : ?Text) : ?Text {
    switch (url) {
      case (null) { null };
      case (?u) {
        if (u == "") { null } else {
          let lower = toLower(u);
          let prefix8 = do {
            var s = ""; var i = 0;
            for (c in lower.chars()) { if (i < 8) { s #= c.toText(); i += 1 } };
            s
          };
          let prefix7 = do {
            var s = ""; var i = 0;
            for (c in lower.chars()) { if (i < 7) { s #= c.toText(); i += 1 } };
            s
          };
          if (prefix8 == "https://") { ?u }
          else if (prefix7 == "http://") { ?u }
          else { ?("https://" # u) };
        };
      };
    };
  };

  func getPrincipalMap(store : Map.Map<Principal, Map.Map<Principal, Bool>>, key : Principal) : Map.Map<Principal, Bool> {
    switch (store.get(key)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Principal, Bool>(); store.add(key, m); m };
    };
  };

  func getNatPrincipalMap(store : Map.Map<Nat, Map.Map<Principal, Bool>>, key : Nat) : Map.Map<Principal, Bool> {
    switch (store.get(key)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Principal, Bool>(); store.add(key, m); m };
    };
  };

  func getPostRepliesMap(postId : Nat) : Map.Map<Nat, Bool> {
    switch (postReplies.get(postId)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Nat, Bool>(); postReplies.add(postId, m); m };
    };
  };

  func getHashtagPosts(tag : Text) : Map.Map<Nat, Bool> {
    switch (hashtagIndex.get(tag)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Nat, Bool>(); hashtagIndex.add(tag, m); m };
    };
  };

  func getNotifMap(user : Principal) : Map.Map<Nat, Notification> {
    switch (userNotifications.get(user)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Nat, Notification>(); userNotifications.add(user, m); m };
    };
  };

  func hasBlocked(blocker : Principal, target : Principal) : Bool {
    switch (blocks.get(blocker)) {
      case (?m) { m.get(target) != null };
      case (null) { false };
    };
  };

  func isBlockedBidirectional(a : Principal, b : Principal) : Bool {
    hasBlocked(a, b) or hasBlocked(b, a);
  };

  func isTokenChar(c : Char) : Bool {
    let code = c.toNat32();
    (code >= 97 and code <= 122) or (code >= 65 and code <= 90) or
    (code >= 48 and code <= 57) or code == 95;
  };

  func extractTokens(text : Text, triggerChar : Char) : [Text] {
    let tokens = List.empty<Text>();
    let seen = Map.empty<Text, Bool>();
    var current = "";
    var inToken = false;
    for (c in text.chars()) {
      if (inToken) {
        if (isTokenChar(c)) { current #= c.toText() }
        else {
          if (current != "" and tokens.size() < 10) {
            let lower = toLower(current);
            if (seen.get(lower) == null) { tokens.add(lower); seen.add(lower, true) };
          };
          current := ""; inToken := false;
          if (c == triggerChar) { inToken := true };
        };
      } else if (c == triggerChar) { inToken := true };
    };
    if (inToken and current != "" and tokens.size() < 10) {
      let lower = toLower(current);
      if (seen.get(lower) == null) { tokens.add(lower); seen.add(lower, true) };
    };
    tokens.toArray();
  };

  func indexPostHashtags(postId : Nat, text : Text) {
    for (tag in extractTokens(text, '#').vals()) { getHashtagPosts(tag).add(postId, true) };
  };

  func removePostHashtags(postId : Nat, text : Text) {
    for (tag in extractTokens(text, '#').vals()) {
      switch (hashtagIndex.get(tag)) { case (?m) { m.remove(postId) }; case (null) {} };
    };
  };

  func addNotification(recipient : Principal, actor_ : Principal, notificationType : NotificationType) {
    if (recipient == actor_) { return };
    if (isBlockedBidirectional(recipient, actor_)) { return };
    let actorUsername = switch (userProfiles.get(actor_)) {
      case (?p) { p.username }; case (null) { "unknown" };
    };
    let id = nextNotificationId;
    nextNotificationId += 1;
    let notif : Notification = { id; notificationType; actorPrincipal = actor_; actorUsername; createdAt = Time.now(); isRead = false };
    let notifs = getNotifMap(recipient);
    notifs.add(id, notif);
    if (notifs.size() > maxNotificationsPerUser) {
      let ids = List.empty<Nat>();
      for ((nid, _) in notifs.entries()) { ids.add(nid) };
      ids.sortInPlace(func(a, b) { if (a < b) { #less } else if (a > b) { #greater } else { #equal } });
      var removed : Nat = 0;
      let toRemove : Nat = notifs.size() - maxNotificationsPerUser;
      for (nid in ids.values()) {
        if (removed < toRemove) { notifs.remove(nid); removed += 1 };
      };
    };
  };

  func notifyMentions(text : Text, postId : Nat, actor_ : Principal) {
    for (username in extractTokens(text, '@').vals()) {
      switch (usernameToUser.get(username)) {
        case (?recipient) { addNotification(recipient, actor_, #mention(postId)) };
        case (null) {};
      };
    };
  };

  func toPostResponse(post : Post, caller : ?Principal) : PostResponse {
    let authorUsername : Text = switch (post.authorIdentity) {
      case (#fan) { switch (userProfiles.get(post.author)) { case (?p) { p.username }; case (null) { "" } } };
      case (#artist) { switch (artistPages.get(post.author)) { case (?a) { a.username }; case (null) { "" } } };
    };
    let authorDisplayName : Text = switch (post.authorIdentity) {
      case (#fan) { switch (userProfiles.get(post.author)) { case (?p) { p.displayName }; case (null) { "" } } };
      case (#artist) { switch (artistPages.get(post.author)) { case (?a) { a.bandName }; case (null) { "" } } };
    };
    let authorProfilePictureHash = switch (post.authorIdentity) {
      case (#fan) { switch (userProfiles.get(post.author)) { case (?p) { p.profilePictureHash }; case (null) { null } } };
      case (#artist) { switch (artistPages.get(post.author)) { case (?a) { a.profilePictureHash }; case (null) { null } } };
    };
    let likes = postLikes.get(post.id);
    let likeCount = switch (likes) { case (?m) { m.size() }; case (null) { 0 } };
    let isLiked = switch (caller) {
      case (?c) { switch (likes) { case (?m) { m.get(c) != null }; case (null) { false } } };
      case (null) { false };
    };
    let replyCount = switch (postReplies.get(post.id)) { case (?m) { m.size() }; case (null) { 0 } };
    let reposts = postReposts.get(post.id);
    let repostCount = switch (reposts) { case (?m) { m.size() }; case (null) { 0 } };
    let isReposted = switch (caller) {
      case (?c) { switch (reposts) { case (?m) { m.get(c) != null }; case (null) { false } } };
      case (null) { false };
    };
    { id = post.id; author = post.author; authorIdentity = post.authorIdentity;
      authorUsername; authorDisplayName; authorProfilePictureHash;
      text = post.text; mediaHash = post.mediaHash; mediaType = post.mediaType;
      postType = post.postType; createdAt = post.createdAt; editedAt = post.editedAt;
      likeCount; replyCount; repostCount; isLikedByCurrentUser = isLiked; isRepostedByCurrentUser = isReposted };
  };

  func paginatePosts(cursor : ?Nat, limit : Nat, callerOpt : ?Principal, predicate : (Post) -> Bool) : PaginatedPosts {
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let startId = switch (cursor) { case (?c) { c }; case (null) { nextPostId } };
    if (startId == 0) { return { posts = []; nextCursor = null; hasMore = false } };
    let buf = List.empty<PostResponse>();
    var foundExtra = false;
    var i : Nat = startId;
    while (i > 0 and not foundExtra) {
      i -= 1;
      switch (posts.get(i)) {
        case (?post) {
          if (predicate(post)) {
            if (buf.size() < effectiveLimit) { buf.add(toPostResponse(post, callerOpt)) }
            else { foundExtra := true };
          };
        };
        case (null) {};
      };
    };
    let arr = buf.toArray();
    let nextCursor : ?Nat = if (foundExtra and arr.size() > 0) { ?arr[arr.size() - 1].id } else { null };
    { posts = arr; nextCursor; hasMore = foundExtra };
  };

  func buildProfileResponse(user : Principal, caller : Principal) : ?UserProfileResponse {
    if (not caller.isAnonymous() and hasBlocked(user, caller)) { return null };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        let followersCount = switch (followers.get(user)) { case (?m) { m.size() }; case (null) { 0 } };
        let followingCount = switch (following.get(user)) { case (?m) { m.size() }; case (null) { 0 } };
        let postsCount = switch (userPostCounts.get(user)) { case (?n) { n }; case (null) { 0 } };
        let isAuth = not caller.isAnonymous();
        let isFollowed = if (isAuth) { switch (following.get(caller)) { case (?m) { m.get(user) != null }; case (null) { false } } } else { false };
        let isBlocked = if (isAuth) { hasBlocked(caller, user) } else { false };
        let isMuted = if (isAuth) { switch (mutes.get(caller)) { case (?m) { m.get(user) != null }; case (null) { false } } } else { false };
        ?{ principal = user; username = profile.username; displayName = profile.displayName;
           bio = profile.bio; profilePictureHash = profile.profilePictureHash;
           headerImageHash = profile.headerImageHash; location = profile.location;
           website = profile.website; createdAt = profile.createdAt; updatedAt = profile.updatedAt;
           followersCount; followingCount; postsCount;
           isFollowedByCurrentUser = isFollowed; isBlockedByCurrentUser = isBlocked; isMutedByCurrentUser = isMuted };
      };
    };
  };

  func toArtistPageResponse(artist : Principal, page : ArtistPage, caller : Principal) : ArtistPageResponse {
    let followerCount = switch (artistFollowers.get(artist)) { case (?m) { m.size() }; case (null) { 0 } };
    let followingCount = switch (artistFollowing.get(artist)) { case (?m) { m.size() }; case (null) { 0 } };
    let postCount = switch (artistPostCounts.get(artist)) { case (?n) { n }; case (null) { 0 } };
    let isFollowed = if (not caller.isAnonymous()) {
      switch (artistFollowers.get(artist)) { case (?m) { m.get(caller) != null }; case (null) { false } }
    } else { false };
    { principal = artist; username = page.username; bandName = page.bandName; genre = page.genre;
      bio = page.bio; musicLinks = page.musicLinks; tier = page.tier;
      profilePictureHash = page.profilePictureHash; headerImageHash = page.headerImageHash;
      location = page.location; website = page.website;
      followerCount; followingCount; postCount;
      createdAt = page.createdAt; updatedAt = page.updatedAt; isFollowedByCurrentUser = isFollowed };
  };

  // ── Artist Pages ──────────────────────────────────────────────────────────

  public shared ({ caller }) func createOrUpdateArtistPage(
    username : Text, bandName : Text, genre : Text, bio : Text,
    musicLinks : [Text], tier : ?Text, location : ?Text, website : ?Text
  ) : async () {
    requireAuth(caller);
    if (not isValidUsername(username)) { Runtime.trap("Username must be 3-20 chars, alphanumeric + underscores") };
    if (bandName.size() < 1 or bandName.size() > 100) { Runtime.trap("Band name must be 1-100 characters") };
    if (genre.size() < 1 or genre.size() > 50) { Runtime.trap("Genre must be 1-50 characters") };
    if (bio.size() > 500) { Runtime.trap("Bio max 500 characters") };
    if (musicLinks.size() > 5) { Runtime.trap("Max 5 music links") };
    let lower = toLower(username);
    switch (usernameToUser.get(lower)) { case (?_) { Runtime.trap("Username already taken") }; case (null) {} };
    switch (artistUsernameToArtist.get(lower)) {
      case (?existing) { if (existing != caller) { Runtime.trap("Username already taken") } };
      case (null) {};
    };
    switch (artistPages.get(caller)) {
      case (?existing) { if (toLower(existing.username) != lower) { artistUsernameToArtist.remove(toLower(existing.username)) } };
      case (null) {};
    };
    let now = Time.now();
    let existing = artistPages.get(caller);
    let page : ArtistPage = {
      username; bandName; genre; bio; musicLinks;
      tier = switch (tier) { case (?t) { t }; case (null) { switch (existing) { case (?e) { e.tier }; case (null) { "free" } } } };
      profilePictureHash = switch (existing) { case (?e) { e.profilePictureHash }; case (null) { null } };
      headerImageHash = switch (existing) { case (?e) { e.headerImageHash }; case (null) { null } };
      location; website = normalizeWebsite(website);
      createdAt = switch (existing) { case (?e) { e.createdAt }; case (null) { now } };
      updatedAt = now;
    };
    artistPages.add(caller, page);
    artistUsernameToArtist.add(lower, caller);
  };

  public query ({ caller }) func getArtistPage() : async ?ArtistPageResponse {
    requireAuth(caller);
    switch (artistPages.get(caller)) {
      case (?page) { ?toArtistPageResponse(caller, page, caller) };
      case (null) { null };
    };
  };

  public query func getArtistPageByPrincipal(principal : Principal) : async ?ArtistPageResponse {
    switch (artistPages.get(principal)) {
      case (?page) { ?toArtistPageResponse(principal, page, principal) };
      case (null) { null };
    };
  };

  public query func getArtistPageByUsername(username : Text) : async ?ArtistPageResponse {
    let lower = toLower(username);
    switch (artistUsernameToArtist.get(lower)) {
      case (?principal) {
        switch (artistPages.get(principal)) {
          case (?page) { ?toArtistPageResponse(principal, page, principal) };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func updateArtistProfilePicture(pictureHash : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    let existing = switch (artistPages.get(caller)) { case (?p) { p }; case (null) { Runtime.trap("No artist page") } };
    artistPages.add(caller, { username = existing.username; bandName = existing.bandName; genre = existing.genre;
      bio = existing.bio; musicLinks = existing.musicLinks; tier = existing.tier;
      profilePictureHash = pictureHash; headerImageHash = existing.headerImageHash;
      location = existing.location; website = existing.website;
      createdAt = existing.createdAt; updatedAt = Time.now() });
  };

  public shared ({ caller }) func updateArtistHeaderImage(headerImageHash : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    let existing = switch (artistPages.get(caller)) { case (?p) { p }; case (null) { Runtime.trap("No artist page") } };
    artistPages.add(caller, { username = existing.username; bandName = existing.bandName; genre = existing.genre;
      bio = existing.bio; musicLinks = existing.musicLinks; tier = existing.tier;
      profilePictureHash = existing.profilePictureHash; headerImageHash;
      location = existing.location; website = existing.website;
      createdAt = existing.createdAt; updatedAt = Time.now() });
  };

  // ── User Profiles ─────────────────────────────────────────────────────────

  public query func checkUsernameAvailability(username : Text) : async Bool {
    if (not isValidUsername(username)) { return false };
    let lower = toLower(username);
    usernameToUser.get(lower) == null and artistUsernameToArtist.get(lower) == null;
  };

  public query func getPrincipalByUsername(username : Text) : async ?Principal {
    usernameToUser.get(toLower(username));
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query func getProfileByPrincipal(principal : Principal) : async ?UserProfileResponse {
    buildProfileResponse(principal, principal);
  };

  public query func getProfileByUsername(username : Text) : async ?UserProfileResponse {
    switch (usernameToUser.get(toLower(username))) {
      case (?principal) { buildProfileResponse(principal, principal) };
      case (null) { null };
    };
  };

  public shared ({ caller }) func setProfile(username : Text, displayName : Text, bio : Text, location : ?Text, website : ?Text) : async () {
    requireAuth(caller);
    if (not isValidUsername(username)) { Runtime.trap("Username must be 3-20 chars, alphanumeric + underscores") };
    if (displayName == "") { Runtime.trap("Display name required") };
    if (displayName.size() > 50) { Runtime.trap("Display name max 50 characters") };
    if (bio.size() > 160) { Runtime.trap("Bio max 160 characters") };
    let lower = toLower(username);
    switch (usernameToUser.get(lower)) {
      case (?existing) { if (existing != caller) { Runtime.trap("Username already taken") } };
      case (null) {};
    };
    switch (artistUsernameToArtist.get(lower)) {
      case (?_) { Runtime.trap("Username already taken by an artist") };
      case (null) {};
    };
    switch (userProfiles.get(caller)) {
      case (?existing) { if (toLower(existing.username) != lower) { usernameToUser.remove(toLower(existing.username)) } };
      case (null) {};
    };
    let now = Time.now();
    let existing = userProfiles.get(caller);
    let profile : UserProfile = {
      username; displayName; bio;
      profilePictureHash = switch (existing) { case (?e) { e.profilePictureHash }; case (null) { null } };
      headerImageHash = switch (existing) { case (?e) { e.headerImageHash }; case (null) { null } };
      location; website = normalizeWebsite(website);
      createdAt = switch (existing) { case (?e) { e.createdAt }; case (null) { now } };
      updatedAt = now;
    };
    userProfiles.add(caller, profile);
    usernameToUser.add(lower, caller);
  };

  public shared ({ caller }) func updateProfilePicture(pictureHash : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    let existing = switch (userProfiles.get(caller)) { case (?p) { p }; case (null) { Runtime.trap("Profile not found") } };
    userProfiles.add(caller, { username = existing.username; displayName = existing.displayName;
      bio = existing.bio; profilePictureHash = pictureHash; headerImageHash = existing.headerImageHash;
      location = existing.location; website = existing.website;
      createdAt = existing.createdAt; updatedAt = Time.now() });
  };

  public shared ({ caller }) func updateHeaderImage(headerImageHash : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    let existing = switch (userProfiles.get(caller)) { case (?p) { p }; case (null) { Runtime.trap("Profile not found") } };
    userProfiles.add(caller, { username = existing.username; displayName = existing.displayName;
      bio = existing.bio; profilePictureHash = existing.profilePictureHash; headerImageHash;
      location = existing.location; website = existing.website;
      createdAt = existing.createdAt; updatedAt = Time.now() });
  };

  // ── Posts ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func createPost(
    text : Text, mediaHash : ?Storage.ExternalBlob, mediaType : ?Text,
    postType : PostType, authorIdentity : AuthorIdentity
  ) : async Nat {
    requireAuth(caller);
    if (text.size() == 0 or text.size() > maxPostLength) { Runtime.trap("Post must be 1-280 characters") };
    switch (mediaHash, mediaType) {
      case (null, null) {};
      case (?_, ?"image") {};
      case (?_, ?"video") {};
      case _ { Runtime.trap("Invalid media combination") };
    };
    switch (authorIdentity) {
      case (#fan) {
        if (userProfiles.get(caller) == null) { Runtime.trap("Create a profile first") };
        let count = switch (userPostCounts.get(caller)) { case (?n) { n }; case (null) { 0 } };
        if (count >= maxPostsPerUser) { Runtime.trap("Post limit reached") };
        userPostCounts.add(caller, count + 1);
      };
      case (#artist) {
        if (artistPages.get(caller) == null) { Runtime.trap("Create an artist page first") };
        let count = switch (artistPostCounts.get(caller)) { case (?n) { n }; case (null) { 0 } };
        if (count >= maxPostsPerUser) { Runtime.trap("Post limit reached") };
        artistPostCounts.add(caller, count + 1);
      };
    };
    switch (postType) {
      case (#reply(parentId)) {
        switch (posts.get(parentId)) {
          case (?_) { getPostRepliesMap(parentId).add(nextPostId, true) };
          case (null) { Runtime.trap("Parent post not found") };
        };
      };
      case (#repost(originalId)) {
        switch (posts.get(originalId)) {
          case (?original) {
            getNatPrincipalMap(postReposts, originalId).add(caller, true);
            addNotification(original.author, caller, #repost(originalId));
          };
          case (null) { Runtime.trap("Original post not found") };
        };
      };
      case (#quote(quotedId)) {
        switch (posts.get(quotedId)) {
          case (?quoted) { addNotification(quoted.author, caller, #quote(quotedId)) };
          case (null) { Runtime.trap("Quoted post not found") };
        };
      };
      case (#original) {};
    };
    let id = nextPostId;
    nextPostId += 1;
    let post : Post = { id; author = caller; text; mediaHash; mediaType; postType; authorIdentity; createdAt = Time.now(); editedAt = null };
    posts.add(id, post);
    indexPostHashtags(id, text);
    notifyMentions(text, id, caller);
    id;
  };

  public shared ({ caller }) func editPost(postId : Nat, newText : Text) : async () {
    requireAuth(caller);
    if (newText.size() == 0 or newText.size() > maxPostLength) { Runtime.trap("Post must be 1-280 characters") };
    let post = switch (posts.get(postId)) { case (?p) { p }; case (null) { Runtime.trap("Post not found") } };
    if (post.author != caller) { Runtime.trap("Not your post") };
    let elapsed : Int = Time.now() - post.createdAt;
    if (elapsed > editDeleteWindowNanos) { Runtime.trap("Edit window expired") };
    removePostHashtags(postId, post.text);
    posts.add(postId, { id = post.id; author = post.author; text = newText; mediaHash = post.mediaHash;
      mediaType = post.mediaType; postType = post.postType; authorIdentity = post.authorIdentity;
      createdAt = post.createdAt; editedAt = ?Time.now() });
    indexPostHashtags(postId, newText);
  };

  public shared ({ caller }) func deletePost(postId : Nat) : async () {
    requireAuth(caller);
    let post = switch (posts.get(postId)) { case (?p) { p }; case (null) { Runtime.trap("Post not found") } };
    if (post.author != caller) { Runtime.trap("Not your post") };
    let elapsed : Int = Time.now() - post.createdAt;
    if (elapsed > editDeleteWindowNanos) { Runtime.trap("Delete window expired") };
    removePostHashtags(postId, post.text);
    posts.remove(postId);
    switch (post.authorIdentity) {
      case (#fan) {
        let count : Int = switch (userPostCounts.get(caller)) { case (?n) { n }; case (null) { 0 } };
        if (count > 0) { userPostCounts.add(caller, Int.abs(count - 1)) };
      };
      case (#artist) {
        let count : Int = switch (artistPostCounts.get(caller)) { case (?n) { n }; case (null) { 0 } };
        if (count > 0) { artistPostCounts.add(caller, Int.abs(count - 1)) };
      };
    };
  };

  public query func getPost(postId : Nat) : async ?PostResponse {
    switch (posts.get(postId)) {
      case (?post) { ?toPostResponse(post, null) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getFeed(cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    let callerOpt = if (caller.isAnonymous()) { null } else { ?caller };
    let followedSet = switch (following.get(caller)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    paginatePosts(cursor, limit, callerOpt, func(post) {
      (post.authorIdentity == #fan) and
      (followedSet.get(post.author) != null or post.author == caller) and
      not isBlockedBidirectional(caller, post.author);
    });
  };

  public query ({ caller }) func getArtistFeed(cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    let callerOpt = if (caller.isAnonymous()) { null } else { ?caller };
    let followedSet = switch (artistFollowing.get(caller)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    paginatePosts(cursor, limit, callerOpt, func(post) {
      (post.authorIdentity == #artist) and
      (followedSet.get(post.author) != null or post.author == caller) and
      not isBlockedBidirectional(caller, post.author);
    });
  };

  public query func getUserPosts(principal : Principal, cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    paginatePosts(cursor, limit, null, func(post) {
      post.author == principal and post.authorIdentity == #fan;
    });
  };

  public query func getArtistPosts(principal : Principal, cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    paginatePosts(cursor, limit, null, func(post) {
      post.author == principal and post.authorIdentity == #artist;
    });
  };

  public query func getExplorePosts(cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    paginatePosts(cursor, limit, null, func(post) {
      post.postType == #original;
    });
  };

  public query func getPostReplies(postId : Nat, cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    paginatePosts(cursor, limit, null, func(post) {
      switch (post.postType) { case (#reply(pid)) { pid == postId }; case _ { false } };
    });
  };

  // ── Likes ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    requireAuth(caller);
    let post = switch (posts.get(postId)) { case (?p) { p }; case (null) { Runtime.trap("Post not found") } };
    getNatPrincipalMap(postLikes, postId).add(caller, true);
    addNotification(post.author, caller, #like(postId));
  };

  public shared ({ caller }) func unlikePost(postId : Nat) : async () {
    requireAuth(caller);
    switch (postLikes.get(postId)) { case (?m) { m.remove(caller) }; case (null) {} };
  };

  public query func getPostLikes(postId : Nat) : async Nat {
    switch (postLikes.get(postId)) { case (?m) { m.size() }; case (null) { 0 } };
  };

  // ── Follows ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func followUser(target : Principal) : async () {
    requireAuth(caller);
    if (caller == target) { Runtime.trap("Cannot follow yourself") };
    if (hasBlocked(target, caller)) { Runtime.trap("Cannot follow this user") };
    getPrincipalMap(following, caller).add(target, true);
    getPrincipalMap(followers, target).add(caller, true);
    addNotification(target, caller, #follow);
  };

  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    requireAuth(caller);
    switch (following.get(caller)) { case (?m) { m.remove(target) }; case (null) {} };
    switch (followers.get(target)) { case (?m) { m.remove(caller) }; case (null) {} };
  };

  public shared ({ caller }) func followArtist(artistPrincipal : Principal) : async () {
    requireAuth(caller);
    if (artistPages.get(artistPrincipal) == null) { Runtime.trap("Artist not found") };
    getPrincipalMap(artistFollowing, caller).add(artistPrincipal, true);
    getPrincipalMap(artistFollowers, artistPrincipal).add(caller, true);
    addNotification(artistPrincipal, caller, #follow);
  };

  public shared ({ caller }) func unfollowArtist(artistPrincipal : Principal) : async () {
    requireAuth(caller);
    switch (artistFollowing.get(caller)) { case (?m) { m.remove(artistPrincipal) }; case (null) {} };
    switch (artistFollowers.get(artistPrincipal)) { case (?m) { m.remove(caller) }; case (null) {} };
  };

  public query func getFollowers(principal : Principal, offset : Nat, limit : Nat) : async PaginatedFollows {
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let principalMap = switch (followers.get(principal)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    let result = List.empty<FollowUserResponse>();
    var skipped : Nat = 0; var collected : Nat = 0; var hasMore = false;
    for ((p, _) in principalMap.entries()) {
      switch (userProfiles.get(p)) {
        case (null) {};
        case (?profile) {
          if (skipped < offset) { skipped += 1 }
          else if (collected < effectiveLimit) {
            result.add({ principal = p; username = profile.username; displayName = profile.displayName; profilePictureHash = profile.profilePictureHash });
            collected += 1;
          } else { hasMore := true };
        };
      };
    };
    { users = result.toArray(); nextOffset = if (hasMore) { ?(offset + effectiveLimit) } else { null }; hasMore };
  };

  public query func getFollowing(principal : Principal, offset : Nat, limit : Nat) : async PaginatedFollows {
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let principalMap = switch (following.get(principal)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    let result = List.empty<FollowUserResponse>();
    var skipped : Nat = 0; var collected : Nat = 0; var hasMore = false;
    for ((p, _) in principalMap.entries()) {
      switch (userProfiles.get(p)) {
        case (null) {};
        case (?profile) {
          if (skipped < offset) { skipped += 1 }
          else if (collected < effectiveLimit) {
            result.add({ principal = p; username = profile.username; displayName = profile.displayName; profilePictureHash = profile.profilePictureHash });
            collected += 1;
          } else { hasMore := true };
        };
      };
    };
    { users = result.toArray(); nextOffset = if (hasMore) { ?(offset + effectiveLimit) } else { null }; hasMore };
  };

  public query func getArtistFollowers(artistPrincipal : Principal, offset : Nat, limit : Nat) : async PaginatedFollows {
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let principalMap = switch (artistFollowers.get(artistPrincipal)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    let result = List.empty<FollowUserResponse>();
    var skipped : Nat = 0; var collected : Nat = 0; var hasMore = false;
    for ((p, _) in principalMap.entries()) {
      switch (userProfiles.get(p)) {
        case (null) {};
        case (?profile) {
          if (skipped < offset) { skipped += 1 }
          else if (collected < effectiveLimit) {
            result.add({ principal = p; username = profile.username; displayName = profile.displayName; profilePictureHash = profile.profilePictureHash });
            collected += 1;
          } else { hasMore := true };
        };
      };
    };
    { users = result.toArray(); nextOffset = if (hasMore) { ?(offset + effectiveLimit) } else { null }; hasMore };
  };

  public query func getArtistFollowing(artistPrincipal : Principal, offset : Nat, limit : Nat) : async PaginatedFollows {
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let principalMap = switch (artistFollowing.get(artistPrincipal)) { case (?m) { m }; case (null) { Map.empty<Principal, Bool>() } };
    let result = List.empty<FollowUserResponse>();
    var skipped : Nat = 0; var collected : Nat = 0; var hasMore = false;
    for ((p, _) in principalMap.entries()) {
      switch (userProfiles.get(p)) {
        case (null) {};
        case (?profile) {
          if (skipped < offset) { skipped += 1 }
          else if (collected < effectiveLimit) {
            result.add({ principal = p; username = profile.username; displayName = profile.displayName; profilePictureHash = profile.profilePictureHash });
            collected += 1;
          } else { hasMore := true };
        };
      };
    };
    { users = result.toArray(); nextOffset = if (hasMore) { ?(offset + effectiveLimit) } else { null }; hasMore };
  };

  // ── Reposts ───────────────────────────────────────────────────────────────

  public query func getPostReposts(postId : Nat) : async Nat {
    switch (postReposts.get(postId)) { case (?m) { m.size() }; case (null) { 0 } };
  };

  // ── Search ────────────────────────────────────────────────────────────────

  public query func searchPosts(query_ : Text, cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    let q = toLower(query_);
    paginatePosts(cursor, limit, null, func(post) {
      toLower(post.text).size() >= q.size() and
      (func() : Bool {
        let h = toLower(post.text);
        let hChars = List.empty<Char>(); for (c in h.chars()) { hChars.add(c) };
        let qChars = List.empty<Char>(); for (c in q.chars()) { qChars.add(c) };
        let hArr = hChars.toArray(); let qArr = qChars.toArray();
        let hLen = hArr.size(); let qLen = qArr.size();
        if (qLen == 0) { return true };
        var i = 0;
        var found = false;
        while (i + qLen <= hLen and not found) {
          var j = 0; var match = true;
          while (j < qLen and match) { if (hArr[i+j] != qArr[j]) { match := false }; j += 1 };
          if (match) { found := true };
          i += 1;
        };
        found;
      })();
    });
  };

  public query func searchUsers(query_ : Text) : async [UserProfileResponse] {
    let q = toLower(query_);
    let result = List.empty<UserProfileResponse>();
    for ((_, profile) in userProfiles.entries()) {
      if (toLower(profile.username).size() >= q.size() or toLower(profile.displayName).size() >= q.size()) {
        switch (usernameToUser.get(toLower(profile.username))) {
          case (?principal) {
            switch (buildProfileResponse(principal, principal)) {
              case (?resp) {
                if (result.size() < 20) { result.add(resp) };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
      };
    };
    result.toArray();
  };

  public query func searchArtists(query_ : Text) : async [ArtistPageResponse] {
    let q = toLower(query_);
    let result = List.empty<ArtistPageResponse>();
    for ((principal, page) in artistPages.entries()) {
      if (result.size() < 20) {
        let uLower = toLower(page.username);
        let qLen = q.size();
        let uContains = if (uLower.size() >= qLen) {
          let uChars = List.empty<Char>(); for (c in uLower.chars()) { uChars.add(c) };
          let qChars = List.empty<Char>(); for (c in q.chars()) { qChars.add(c) };
          let uArr = uChars.toArray(); let qArr = qChars.toArray();
          let uLen = uArr.size();
          var i = 0; var found = false;
          while (i + qLen <= uLen and not found) {
            var j = 0; var match = true;
            while (j < qLen and match) { if (uArr[i+j] != qArr[j]) { match := false }; j += 1 };
            if (match) { found := true };
            i += 1;
          };
          found
        } else { false };
        if (uContains) { result.add(toArtistPageResponse(principal, page, principal)) };
      };
    };
    result.toArray();
  };

  // ── Hashtags ──────────────────────────────────────────────────────────────

  public query func getPostsByHashtag(tag : Text, cursor : ?Nat, limit : Nat) : async PaginatedPosts {
    let lower = toLower(tag);
    paginatePosts(cursor, limit, null, func(post) {
      switch (hashtagIndex.get(lower)) {
        case (?m) { m.get(post.id) != null };
        case (null) { false };
      };
    });
  };

  public query func getTrendingHashtags(maxResults : Nat) : async [TrendingHashtag] {
    let limit = if (maxResults > 20) { 20 } else if (maxResults == 0) { 10 } else { maxResults };
    let tags = List.empty<TrendingHashtag>();
    for ((tag, postMap) in hashtagIndex.entries()) {
      tags.add({ tag; count = postMap.size() });
    };
    tags.sortInPlace(func(a, b) {
      if (a.count > b.count) { #less } else if (a.count < b.count) { #greater } else { #equal };
    });
    let result = List.empty<TrendingHashtag>();
    var i = 0;
    for (t in tags.values()) {
      if (i < limit) { result.add(t); i += 1 };
    };
    result.toArray();
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  public query ({ caller }) func getNotifications(cursor : ?Nat, limit : Nat) : async PaginatedNotifications {
    requireAuth(caller);
    let effectiveLimit = if (limit > 50) { 50 } else if (limit == 0) { 20 } else { limit };
    let notifs = getNotifMap(caller);
    let allNotifs = List.empty<Notification>();
    for ((_, n) in notifs.entries()) { allNotifs.add(n) };
    allNotifs.sortInPlace(func(a, b) {
      if (a.id > b.id) { #less } else if (a.id < b.id) { #greater } else { #equal };
    });
    let start = switch (cursor) { case (?c) { c }; case (null) { nextNotificationId } };
    let result = List.empty<Notification>();
    var foundExtra = false;
    for (n in allNotifs.values()) {
      if (not foundExtra and n.id < start) {
        if (result.size() < effectiveLimit) { result.add(n) } else { foundExtra := true };
      };
    };
    let arr = result.toArray();
    let nextCursor : ?Nat = if (foundExtra and arr.size() > 0) { ?arr[arr.size() - 1].id } else { null };
    { notifications = arr; nextCursor; hasMore = foundExtra };
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (caller.isAnonymous()) { return 0 };
    switch (userNotifications.get(caller)) {
      case (null) { 0 };
      case (?notifs) {
        var count = 0;
        for ((_, n) in notifs.entries()) { if (not n.isRead) { count += 1 } };
        count;
      };
    };
  };

  public shared ({ caller }) func markNotificationRead(notifId : Nat) : async () {
    requireAuth(caller);
    let notifs = getNotifMap(caller);
    switch (notifs.get(notifId)) {
      case (?notif) {
        notifs.add(notifId, { id = notif.id; notificationType = notif.notificationType;
          actorPrincipal = notif.actorPrincipal; actorUsername = notif.actorUsername;
          createdAt = notif.createdAt; isRead = true });
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    requireAuth(caller);
    let notifs = getNotifMap(caller);
    let ids = List.empty<Nat>();
    for ((id, _) in notifs.entries()) { ids.add(id) };
    for (id in ids.values()) {
      switch (notifs.get(id)) {
        case (?notif) {
          if (not notif.isRead) {
            notifs.add(id, { id = notif.id; notificationType = notif.notificationType;
              actorPrincipal = notif.actorPrincipal; actorUsername = notif.actorUsername;
              createdAt = notif.createdAt; isRead = true });
          };
        };
        case (null) {};
      };
    };
  };

  // ── Moderation ────────────────────────────────────────────────────────────

  public shared ({ caller }) func blockUser(target : Principal) : async () {
    requireAuth(caller);
    if (caller == target) { Runtime.trap("Cannot block yourself") };
    getPrincipalMap(blocks, caller).add(target, true);
    switch (following.get(caller)) { case (?m) { m.remove(target) }; case (null) {} };
    switch (followers.get(caller)) { case (?m) { m.remove(target) }; case (null) {} };
    switch (following.get(target)) { case (?m) { m.remove(caller) }; case (null) {} };
    switch (followers.get(target)) { case (?m) { m.remove(caller) }; case (null) {} };
  };

  public shared ({ caller }) func unblockUser(target : Principal) : async () {
    requireAuth(caller);
    switch (blocks.get(caller)) { case (?m) { m.remove(target) }; case (null) {} };
  };

  public shared ({ caller }) func muteUser(target : Principal) : async () {
    requireAuth(caller);
    if (caller == target) { Runtime.trap("Cannot mute yourself") };
    getPrincipalMap(mutes, caller).add(target, true);
  };

  public shared ({ caller }) func unmuteUser(target : Principal) : async () {
    requireAuth(caller);
    switch (mutes.get(caller)) { case (?m) { m.remove(target) }; case (null) {} };
  };

  public query ({ caller }) func getBlockedUsers() : async [Principal] {
    requireAuth(caller);
    switch (blocks.get(caller)) {
      case (null) { [] };
      case (?m) { let result = List.empty<Principal>(); for ((p, _) in m.entries()) { result.add(p) }; result.toArray() };
    };
  };

  public query ({ caller }) func getMutedUsers() : async [Principal] {
    requireAuth(caller);
    switch (mutes.get(caller)) {
      case (null) { [] };
      case (?m) { let result = List.empty<Principal>(); for ((p, _) in m.entries()) { result.add(p) }; result.toArray() };
    };
  };
};
