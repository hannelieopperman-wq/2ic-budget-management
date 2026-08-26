import { assetUrl } from '../../utils/assetUrl';
import type { Member } from '../../types/budget';

const toneBg: Record<Member['color'], string> = {
  rose: 'bg-rose text-white',
  sage: 'bg-sage-deep text-white',
  champagne: 'bg-champagne-deep text-white',
  coral: 'bg-coral-deep text-white',
  plum: 'bg-plum text-white',
};

/** avatarUrl may be a data: URL (uploaded photo), an http(s) URL, or a /public asset path. */
function resolveAvatarSrc(avatarUrl: string): string {
  if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) return avatarUrl;
  return assetUrl(avatarUrl);
}

/** Renders a member's photo avatar, or a colored initial badge as a fallback. */
export function MemberAvatar({
  member,
  size = 32,
  className = '',
}: {
  member: Pick<Member, 'name' | 'color' | 'avatarUrl'>;
  size?: number;
  className?: string;
}) {
  if (member.avatarUrl) {
    return (
      <img
        src={resolveAvatarSrc(member.avatarUrl)}
        alt=""
        style={{ width: size, height: size }}
        className={`inline-block shrink-0 rounded-full object-cover align-middle ${className}`}
      />
    );
  }
  const initial = member.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={`inline-grid shrink-0 place-items-center rounded-full align-middle font-serif font-semibold ${toneBg[member.color]} ${className}`}
    >
      {initial}
    </span>
  );
}
