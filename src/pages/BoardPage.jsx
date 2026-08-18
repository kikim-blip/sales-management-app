// src/pages/BoardPage.jsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import {
  Plus, Search, Pin, Pencil, Trash2, X, Save, ChevronDown, ChevronUp,
  Megaphone, FileText, Clipboard, BookOpen, Tag, User, Calendar, Eye
} from 'lucide-react';

const CATEGORIES = ['전체', '공지', '업무자료', '가이드', '공유', '기타'];
const CATEGORY_COLORS = {
  '공지':    'bg-rose-100 text-rose-700 border-rose-200',
  '업무자료': 'bg-blue-100 text-blue-700 border-blue-200',
  '가이드':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  '공유':    'bg-amber-100 text-amber-700 border-amber-200',
  '기타':    'bg-slate-100 text-slate-600 border-slate-200',
};
const CATEGORY_ICONS = {
  '공지':    <Megaphone className="w-3 h-3" />,
  '업무자료': <FileText className="w-3 h-3" />,
  '가이드':  <BookOpen className="w-3 h-3" />,
  '공유':    <Clipboard className="w-3 h-3" />,
  '기타':    <Tag className="w-3 h-3" />,
};

function PostModal({ post, onSave, onClose, user }) {
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    category: post?.category || '공지',
    is_pinned: post?.is_pinned || false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('제목을 입력해 주세요.');
    if (!form.content.trim()) return alert('내용을 입력해 주세요.');
    setSubmitting(true);
    await onSave({
      ...form,
      author_name: user?.userName || user?.name || '익명',
      author_email: user?.email || '',
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {post ? '게시물 수정' : '새 게시물 작성'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* 카테고리 & 고정 */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">카테고리</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {CATEGORIES.filter(c => c !== '전체').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer select-none mb-0.5">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-blue-500" /> 상단 고정
                  </span>
                </label>
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">제목 *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="제목을 입력하세요"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">내용 *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="내용을 입력하세요..."
                rows={10}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
              취소
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60">
              <Save className="w-4 h-4" />
              {submitting ? '저장 중...' : (post ? '수정 완료' : '등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostDetailModal({ post, onClose, onEdit, onDelete, user }) {
  const isAuthor = user?.email && post.author_email && user.email.toLowerCase() === post.author_email.toLowerCase();
  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';
  const canEdit = isAuthor || isAdmin;

  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['기타'];
  const catIcon = CATEGORY_ICONS[post.category] || CATEGORY_ICONS['기타'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {post.is_pinned && (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                  <Pin className="w-3 h-3" /> 고정
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 border ${catColor}`}>
                {catIcon} {post.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{post.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author_name || '익명'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{(post.created_at || '').slice(0, 16)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>
        </div>

        {canEdit && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
            <button
              onClick={() => { onClose(); onEdit(post); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
            >
              <Pencil className="w-3.5 h-3.5" /> 수정
            </button>
            <button
              onClick={() => { if (window.confirm('이 게시물을 삭제하시겠습니까?')) { onDelete(post.id); onClose(); } }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { posts, addPost, updatePost, deletePost } = useData();
  const { user } = useGoogleAuth();

  const isAdmin = user?.role === '관리자' || user?.email?.toLowerCase() === 'richkikim@gmail.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);

  const filteredPosts = useMemo(() => {
    return (posts || []).filter(p => {
      const matchCat = selectedCategory === '전체' || p.category === selectedCategory;
      const matchSearch = !searchTerm || p.title?.includes(searchTerm) || p.content?.includes(searchTerm) || p.author_name?.includes(searchTerm);
      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, searchTerm]);

  const pinnedPosts = filteredPosts.filter(p => p.is_pinned);
  const normalPosts = filteredPosts.filter(p => !p.is_pinned);

  const handleSave = async (data) => {
    if (editingPost) {
      await updatePost(editingPost.id, data);
      setEditingPost(null);
    } else {
      await addPost(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 mb-1">업무 게시판</h1>
          <p className="text-sm text-slate-500">팀 공지사항 및 업무 자료를 공유합니다.</p>
        </div>

        {/* 상단 툴바 */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* 검색 */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="제목, 내용, 작성자 검색..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 글쓰기 버튼 */}
          <button
            onClick={() => { setEditingPost(null); setShowWriteModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> 글쓰기
          </button>
        </div>

        {/* 게시물 목록 */}
        <div className="space-y-2">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">게시물이 없습니다.</p>
              <p className="text-slate-300 text-sm mt-1">첫 번째 게시물을 작성해 보세요!</p>
            </div>
          ) : (
            <>
              {/* 고정 게시물 */}
              {pinnedPosts.map(post => (
                <PostRow
                  key={post.id}
                  post={post}
                  pinned
                  onClick={() => setViewingPost(post)}
                  onEdit={() => { setEditingPost(post); setShowWriteModal(true); }}
                  onDelete={deletePost}
                  user={user}
                  isAdmin={isAdmin}
                />
              ))}
              {/* 일반 게시물 */}
              {normalPosts.map(post => (
                <PostRow
                  key={post.id}
                  post={post}
                  onClick={() => setViewingPost(post)}
                  onEdit={() => { setEditingPost(post); setShowWriteModal(true); }}
                  onDelete={deletePost}
                  user={user}
                  isAdmin={isAdmin}
                />
              ))}
            </>
          )}
        </div>

        {/* 합계 */}
        {filteredPosts.length > 0 && (
          <div className="mt-4 text-center text-xs text-slate-400">
            총 {filteredPosts.length}건의 게시물
          </div>
        )}
      </div>

      {/* 작성/수정 모달 */}
      {showWriteModal && (
        <PostModal
          post={editingPost}
          onSave={handleSave}
          onClose={() => { setShowWriteModal(false); setEditingPost(null); }}
          user={user}
        />
      )}

      {/* 상세 보기 모달 */}
      {viewingPost && (
        <PostDetailModal
          post={viewingPost}
          onClose={() => setViewingPost(null)}
          onEdit={(p) => { setEditingPost(p); setShowWriteModal(true); }}
          onDelete={deletePost}
          user={user}
        />
      )}
    </div>
  );
}

function PostRow({ post, pinned, onClick, onEdit, onDelete, user, isAdmin }) {
  const isAuthor = user?.email && post.author_email && user.email.toLowerCase() === post.author_email.toLowerCase();
  const canEdit = isAuthor || isAdmin;

  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['기타'];
  const catIcon = CATEGORY_ICONS[post.category] || CATEGORY_ICONS['기타'];

  return (
    <div className={`group bg-white rounded-xl border transition hover:shadow-md cursor-pointer ${pinned ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3.5" onClick={onClick}>
        {/* 고정 핀 */}
        {pinned && <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}

        {/* 카테고리 */}
        <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 border flex-shrink-0 ${catColor}`}>
          {catIcon} {post.category}
        </span>

        {/* 제목 */}
        <span className="flex-1 text-sm font-semibold text-slate-800 truncate">
          {post.title}
        </span>

        {/* 메타 */}
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1">
            <User className="w-3 h-3" />{post.author_name || '익명'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />{(post.created_at || '').slice(0, 10)}
          </span>
        </div>

        {/* 액션 버튼 */}
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onEdit(post)}
              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition"
              title="수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { if (window.confirm('삭제하시겠습니까?')) onDelete(post.id); }}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
