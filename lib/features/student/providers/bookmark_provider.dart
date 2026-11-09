import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/bookmark_model.dart';
import '../../auth/providers/auth_provider.dart';

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  return BookmarkRepository(FirebaseFirestore.instance);
});

class BookmarkRepository {
  final FirebaseFirestore _firestore;

  BookmarkRepository(this._firestore);

  Stream<List<BookmarkModel>> getUserBookmarks(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('bookmarks')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => BookmarkModel.fromJson(doc.data()))
              .toList();
        });
  }

  Future<void> addBookmark(BookmarkModel bookmark) async {
    await _firestore
        .collection('users')
        .doc(bookmark.userId)
        .collection('bookmarks')
        .doc(bookmark.id)
        .set(bookmark.toJson());
  }

  Future<void> removeBookmark(String userId, String bookmarkId) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('bookmarks')
        .doc(bookmarkId)
        .delete();
  }
}

// Stream provider to expose the user's current bookmarks
final userBookmarksProvider = StreamProvider.autoDispose<List<BookmarkModel>>((
  ref,
) {
  final userAsync = ref.watch(authStateProvider);
  final user = userAsync.value;

  if (user == null || user.email.startsWith('guest_')) {
    return Stream.value([]);
  }

  final repository = ref.watch(bookmarkRepositoryProvider);
  return repository.getUserBookmarks(user.id);
});

// A provider that determines if a specific question is bookmarked
final isQuestionBookmarkedProvider = Provider.family<bool, String>((
  ref,
  questionId,
) {
  final bookmarksAsyncValue = ref.watch(userBookmarksProvider);
  return bookmarksAsyncValue.maybeWhen(
    data: (bookmarks) => bookmarks.any((b) => b.questionId == questionId),
    orElse: () => false,
  );
});

// Provider for specific bookmark actions (add/remove)
final bookmarkActionsProvider = Provider<BookmarkActions>((ref) {
  final repository = ref.read(bookmarkRepositoryProvider);
  return BookmarkActions(repository);
});

class BookmarkActions {
  final BookmarkRepository repository;

  BookmarkActions(this.repository);

  Future<void> toggleBookmark({
    required String userId,
    required String examId,
    required String questionId,
    required String questionHtml,
    required String subjectName,
    required String examTitle,
    required bool currentlyBookmarked,
  }) async {
    // Generate a unique ID specifically bridging userId and questionId
    final bookmarkId = '${userId}_$questionId';

    if (currentlyBookmarked) {
      await repository.removeBookmark(userId, bookmarkId);
    } else {
      final bookmark = BookmarkModel(
        id: bookmarkId,
        userId: userId,
        examId: examId,
        questionId: questionId,
        questionHtml: questionHtml,
        subjectName: subjectName,
        examTitle: examTitle,
        timestamp: DateTime.now(),
      );
      await repository.addBookmark(bookmark);
    }
  }
}
