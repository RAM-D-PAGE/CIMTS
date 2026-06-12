import { useState, useMemo, useCallback } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Search,
  Plus,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Trash2,
  Edit3,
  FileText,
  Download,
} from 'lucide-react';
import { useDataStore } from '../../stores/useDataStore';
import { generateId, formatDate, getCategoryColor } from '../../utils/helpers';
import type { Note, NoteCategory } from '../../types';
import styles from './NotesPage.module.css';

const categories: NoteCategory[] = ['task', 'learning', 'problem', 'idea', 'meeting', 'other'];

export default function NotesPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { notes, addNote, updateNote, deleteNote } = useDataStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(searchParams.get('new') === '1');

  // New note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('task');
  const [noteTags, setNoteTags] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: t('notes.contentPlaceholder') }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch = !search ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = activeCategory === 'all' || note.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [notes, search, activeCategory]);

  const openNewNote = useCallback(() => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteCategory('task');
    setNoteTags('');
    editor?.commands.setContent('');
    setIsEditorOpen(true);
  }, [editor]);

  const openEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setNoteTags(note.tags.join(', '));
    editor?.commands.setContent(note.content);
    setIsEditorOpen(true);
  }, [editor]);

  const saveNote = useCallback(() => {
    if (!noteTitle.trim()) return;
    const content = editor?.getHTML() || '';
    const tags = noteTags.split(',').map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();

    if (editingNote) {
      updateNote(editingNote.id, {
        title: noteTitle,
        content,
        category: noteCategory,
        tags,
      });
    } else {
      addNote({
        id: generateId(),
        title: noteTitle,
        content,
        category: noteCategory,
        tags,
        date: now.split('T')[0],
        createdAt: now,
        updatedAt: now,
      });
    }
    setIsEditorOpen(false);
  }, [noteTitle, noteCategory, noteTags, editor, editingNote, addNote, updateNote]);

  const exportAsMarkdown = useCallback((note: Note) => {
    let markdown = `# ${note.title}\n\n`;
    markdown += `*Category: ${note.category}*\n`;
    markdown += `*Created At: ${new Date(note.createdAt).toLocaleString()}*\n\n`;

    let body = note.content;
    body = body.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
    body = body.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
    body = body.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
    body = body.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    body = body.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    body = body.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    body = body.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    body = body.replace(/<ul>/gi, '');
    body = body.replace(/<\/ul>/gi, '\n');
    body = body.replace(/<ol>/gi, '');
    body = body.replace(/<\/ol>/gi, '\n');
    body = body.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');
    body = body.replace(/<br\s*\/?>/gi, '\n');
    body = body.replace(/<[^>]+>/g, '');

    markdown += body;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAsPDF = useCallback((note: Note) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'sans-serif'; padding: 40px; color: #1f2937;">
        <h1 style="border-bottom: 2px solid #6366F1; padding-bottom: 10px; margin-bottom: 20px;">
          ${note.title}
        </h1>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
          <strong>Date:</strong> ${formatDate(note.createdAt, i18n.language)} <br/>
          <strong>Category:</strong> ${t(`notes.categories.${note.category}`)}
        </div>
        <div style="line-height: 1.6; font-size: 16px;">
          ${note.content}
        </div>
      </div>
    `;

    const opt = {
      margin:       15,
      filename:     `InternLog_${note.title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  }, [i18n.language, t]);

  const handleExportMarkdownCurrent = useCallback(() => {
    const content = editor?.getHTML() || '';
    const tags = noteTags.split(',').map((t) => t.trim()).filter(Boolean);
    const tempNote: Note = {
      id: editingNote?.id || 'temp',
      title: noteTitle || 'Untitled Note',
      content,
      category: noteCategory,
      tags,
      date: new Date().toISOString().split('T')[0],
      createdAt: editingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    exportAsMarkdown(tempNote);
  }, [editor, noteTitle, noteCategory, noteTags, editingNote, exportAsMarkdown]);

  const handleExportPDFCurrent = useCallback(() => {
    const content = editor?.getHTML() || '';
    const tags = noteTags.split(',').map((t) => t.trim()).filter(Boolean);
    const tempNote: Note = {
      id: editingNote?.id || 'temp',
      title: noteTitle || 'Untitled Note',
      content,
      category: noteCategory,
      tags,
      date: new Date().toISOString().split('T')[0],
      createdAt: editingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    exportAsPDF(tempNote);
  }, [editor, noteTitle, noteCategory, noteTags, editingNote, exportAsPDF]);

  const handleDeleteNote = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('notes.deleteConfirm'))) {
      deleteNote(id);
    }
  }, [deleteNote, t]);

  const stripHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  };

  return (
    <div className={styles.notesPage}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={16} />
          <input
            placeholder={t('notes.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterTags}>
          <button
            className={`${styles.filterTag} ${activeCategory === 'all' ? styles.active : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {t('common.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterTag} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {t(`notes.categories.${cat}`)}
            </button>
          ))}
        </div>
        <button className={styles.newNoteBtn} onClick={openNewNote}>
          <Plus size={18} />
          {t('notes.newNote')}
        </button>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FileText size={28} /></div>
          <div className={styles.emptyTitle}>{t('notes.noNotes')}</div>
        </div>
      ) : (
        <div className={styles.notesGrid}>
          {filteredNotes.map((note, i) => (
            <div
              key={note.id}
              className={`${styles.noteCard} animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
              onClick={() => openEditNote(note)}
            >
              <div className={styles.noteCardAccent} style={{ background: getCategoryColor(note.category) }} />
              <div className={styles.noteCardHeader}>
                <div className={styles.noteTitle}>{note.title}</div>
                <span className={styles.noteCategory} style={{ background: getCategoryColor(note.category) }}>
                  {t(`notes.categories.${note.category}`)}
                </span>
              </div>
              <div className={styles.notePreview}>{stripHtml(note.content)}</div>
              <div className={styles.noteFooter}>
                <span className={styles.noteDate}>{formatDate(note.createdAt, i18n.language)}</span>
                <div className={styles.noteActions}>
                  <button
                    className={styles.noteActionBtn}
                    onClick={(e) => { e.stopPropagation(); openEditNote(note); }}
                    title={t('common.edit')}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className={styles.noteActionBtn}
                    onClick={(e) => { e.stopPropagation(); exportAsPDF(note); }}
                    title="Export as PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className={styles.noteActionBtn}
                    onClick={(e) => { e.stopPropagation(); exportAsMarkdown(note); }}
                    title="Export as Markdown"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    className={`${styles.noteActionBtn} ${styles.danger}`}
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {note.tags.length > 0 && (
                <div className={styles.noteTags}>
                  {note.tags.map((tag) => (
                    <span key={tag} className={styles.noteTag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className={styles.editorOverlay} onClick={() => setIsEditorOpen(false)}>
          <div className={styles.editorModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editorHeader}>
              <div className={styles.editorTitle}>
                {editingNote ? t('notes.editNote') : t('notes.newNote')}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className={styles.editorCloseBtn}
                  onClick={handleExportMarkdownCurrent}
                  title="Export as Markdown"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={handleExportPDFCurrent}
                  title="Print / Export as PDF"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  PDF
                </button>
                <button className={styles.editorCloseBtn} onClick={() => setIsEditorOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.editorBody}>
              <input
                className={styles.editorInputTitle}
                placeholder={t('notes.titlePlaceholder')}
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                autoFocus
              />

              <div className={styles.editorRow}>
                <div className={styles.editorField}>
                  <label>{t('notes.category')}</label>
                  <select
                    className={styles.editorSelect}
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{t(`notes.categories.${cat}`)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.editorField}>
                  <label>{t('notes.tags')}</label>
                  <input
                    className={styles.editorInput}
                    placeholder="tag1, tag2, ..."
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                  />
                </div>
              </div>

              {/* TipTap Editor */}
              <div className={styles.tipTapWrap}>
                <div className={styles.toolbar}>
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('bold') ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    title="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('italic') ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    title="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <div className={styles.toolbarDivider} />
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('heading', { level: 2 }) ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading"
                  >
                    <Heading2 size={16} />
                  </button>
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('bulletList') ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                  >
                    <List size={16} />
                  </button>
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('orderedList') ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    title="Ordered List"
                  >
                    <ListOrdered size={16} />
                  </button>
                  <div className={styles.toolbarDivider} />
                  <button
                    className={`${styles.toolbarBtn} ${editor?.isActive('blockquote') ? styles.active : ''}`}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    title="Quote"
                  >
                    <Quote size={16} />
                  </button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className={styles.editorFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsEditorOpen(false)}>
                {t('notes.cancel')}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveNote}>
                {t('notes.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
