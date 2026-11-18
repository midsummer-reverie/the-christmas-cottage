export default function ProfileAvatar({ value, alt = "", className = "" }: { value?: string | null; alt?: string; className?: string }) {
  if (value?.startsWith("emoji:")) {
    return <span className={`${className} profile-avatar-emoji`} role={alt ? "img" : undefined} aria-label={alt || undefined}>{value.slice(6)}</span>;
  }
  if (value) return <img className={className} src={value} alt={alt} referrerPolicy="no-referrer"/>;
  return <span className={`${className} profile-avatar-emoji`} aria-hidden={alt ? undefined : true} role={alt ? "img" : undefined} aria-label={alt || undefined}>🎄</span>;
}
