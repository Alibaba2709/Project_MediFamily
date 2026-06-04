import Image from "next/image";

type MemberAvatarProps = {
  name: string;
  tone: string;
  imageDataUrl?: string;
  className?: string;
  textClassName?: string;
};

export function MemberAvatar({
  name,
  tone,
  imageDataUrl,
  className = "size-9",
  textClassName = "text-sm",
}: MemberAvatarProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${
        imageDataUrl ? "bg-white" : tone
      } ${className}`}
    >
      {imageDataUrl ? (
        <Image
          alt={`Foto profilo di ${name}`}
          className="object-cover"
          fill
          sizes="64px"
          src={imageDataUrl}
          unoptimized
        />
      ) : (
        <span className={`font-semibold text-[#313a35] ${textClassName}`}>
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
