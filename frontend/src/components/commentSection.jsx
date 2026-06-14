import React, { useState } from 'react';
import { MessageSquare, Pencil, Send, Trash2, User } from 'lucide-react';

const isPrivilegedRole = (role) => ['ADMIN', 'STAFF', 'TECHNICIAN'].includes(String(role || '').toUpperCase());

export const CommentSection = ({ comments, onAddComment, onDeleteComment, onUpdateComment, currentUserId, currentUserRole }) => {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingText, setEditingText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text || '');
  };

  const cancelEditing = () => {
    setEditingCommentId('');
    setEditingText('');
  };

  const submitEdit = async (commentId) => {
    if (!editingText.trim()) {
      return;
    }

    await onUpdateComment(commentId, editingText.trim());
    cancelEditing();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-[var(--text-primary)] font-bold border-b border-[var(--border)] pb-6">
        <MessageSquare size={20} className="text-[var(--primary)]" />
        <h2 className="uppercase tracking-widest text-sm">Comments ({comments.length})</h2>
      </div>

      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="glass-panel rounded-2xl p-6 transition-all hover:glass-panel-strong"
          >
              {(() => {
                const canEdit = comment.isOwner || comment.authorId === currentUserId;
                const canDelete = canEdit || isPrivilegedRole(currentUserRole);
                const isEditing = editingCommentId === comment.id;

                return (
                  <>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white shadow-lg shadow-[rgba(249,115,22,0.2)]">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{comment.authorName}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex gap-1 bg-[var(--bg-section)] rounded-lg p-1 backdrop-blur-sm border border-[var(--border)]">
                    {canEdit && (
                      <button
                        onClick={() => (isEditing ? cancelEditing() : startEditing(comment))}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => onDeleteComment(comment.id)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3 mt-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full glass-input rounded-xl p-4 text-sm font-medium"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => submitEdit(comment.id)}
                      className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[rgba(249,115,22,0.22)] hover:scale-105 active:scale-95 transition-all"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg bg-[var(--bg-section)] px-5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all border border-[var(--border)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light mt-2 bg-[var(--bg-section)] rounded-xl p-4 border border-[var(--border)]">
                  {comment.text}
                </p>
              )}
                  </>
                );
              })()}
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center py-12 glass-panel rounded-2xl flex justify-center items-center opacity-60">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
              <MessageSquare size={14} />
              No comments yet
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
          className="w-full glass-input rounded-2xl p-6 pr-16 text-sm min-h-[140px] resize-none font-medium shadow-inner"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="absolute bottom-6 right-6 p-3.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white rounded-full hover:scale-110 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(249,115,22,0.28)]"
        >
          <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
        </button>
      </form>
    </div>
  );
};
