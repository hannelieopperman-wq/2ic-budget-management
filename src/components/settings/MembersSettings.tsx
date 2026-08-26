import { useRef, useState } from 'react';
import { Pencil, Plus, Trash2, User, Check, Upload, X } from 'lucide-react';
import { Card, Modal, Input, Select, Button, EmptyState } from '../ui';
import { MemberAvatar } from '../ui/MemberAvatar';
import { useApp } from '../../store/AppStore';
import type { Member } from '../../types/budget';

const emptyMember = (): Member => ({ id: `mem_${Date.now()}`, name: '', color: 'rose', avatarUrl: null });

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB — plenty for a profile photo, keeps memory sane

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MembersSettings() {
  const { members, householdName, setHouseholdName, addMember, updateMember, removeMember } = useApp();
  const [editing, setEditing] = useState<Member | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [nameDraft, setNameDraft] = useState(householdName);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setEditing(emptyMember());
    setIsNew(true);
    setUploadError(null);
  };
  const openEdit = (m: Member) => {
    setEditing({ ...m });
    setIsNew(false);
    setUploadError(null);
  };
  const save = () => {
    if (!editing || !editing.name.trim()) return;
    if (isNew) addMember(editing);
    else updateMember(editing);
    setEditing(null);
  };

  const onFileChosen = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('That image is a bit large — please choose one under 3MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditing({ ...editing, avatarUrl: dataUrl });
    } catch {
      setUploadError('Could not read that file — please try another image.');
    }
  };

  return (
    <Card className="p-6 animate-slide-up">
      <div className="mb-5">
        <h2 className="font-serif text-lg text-plum-ink">Household name</h2>
        <p className="mt-0.5 mb-3 text-xs text-plum-soft">Shown as your Combined view name — e.g. "Joubert Family".</p>
        <div className="flex gap-2">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="e.g. Joubert Family"
            className="flex-1 rounded-2xl border border-blush bg-white/70 px-4 py-2.5 text-sm text-plum-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/30"
          />
          <Button
            variant="secondary"
            onClick={() => setHouseholdName(nameDraft.trim() || 'Our Household')}
            disabled={nameDraft.trim() === householdName}
          >
            <Check size={16} /> Save
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between border-t border-blush/50 pt-5">
        <div>
          <h2 className="font-serif text-lg text-plum-ink">Profiles</h2>
          <p className="mt-0.5 text-xs text-plum-soft">
            Everyone shares one login. Profiles just split up whose accounts, pools and spending show where.
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> Add profile
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No profiles yet" message="Add household profiles to split combined and individual views." icon={<User size={26} />} />
      ) : (
        <ul className="divide-y divide-blush/40">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <MemberAvatar member={m} size={40} />
                <p className="font-medium text-plum-ink">{m.name}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(m)}
                  aria-label={`Edit ${m.name}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-blush hover:text-plum"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => removeMember(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="rounded-full p-1.5 text-plum-soft hover:bg-coral/15 hover:text-coral-deep"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add profile' : 'Edit profile'}
        footer={
          editing && (
            <div className="flex items-center justify-between gap-3">
              {!isNew ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    removeMember(editing.id);
                    setEditing(null);
                  }}
                  className="text-coral-deep"
                >
                  <Trash2 size={16} /> Remove
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={save}>
                  Save
                </Button>
              </div>
            </div>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Sarah"
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-plum-soft">Picture</span>
              <div className="flex items-center gap-4">
                <MemberAvatar member={editing} size={64} />
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={15} /> Upload photo
                    </Button>
                    {editing.avatarUrl && (
                      <Button variant="ghost" onClick={() => setEditing({ ...editing, avatarUrl: null })}>
                        <X size={15} /> Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChosen(e.target.files?.[0])}
                  />
                  <p className="text-xs text-plum-soft">JPG or PNG, under 3MB. Without a photo, your initial is shown instead.</p>
                  {uploadError && <p className="text-xs text-coral-deep">{uploadError}</p>}
                </div>
              </div>
            </div>

            <Select
              label="Badge colour (used when there's no photo)"
              value={editing.color}
              onChange={(e) => setEditing({ ...editing, color: e.target.value as Member['color'] })}
            >
              <option value="rose">Dusty rose</option>
              <option value="sage">Sage</option>
              <option value="champagne">Champagne</option>
              <option value="coral">Coral</option>
              <option value="plum">Plum</option>
            </Select>

            <p className="rounded-2xl bg-blush-soft/60 px-4 py-3 text-xs text-plum-soft">
              Accounts and pools not assigned to any profile are treated as shared/joint and always show up,
              in every view. Uploaded photos stay in this browser session only until Supabase storage is
              connected in Phase 2 — they won't survive a refresh yet, same as everything else in this demo.
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
