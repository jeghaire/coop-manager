import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AvatarStub({
  name,
  image,
  className,
}: {
  name: string;
  image: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage src={image} alt={name} />
      <AvatarFallback className="rounded-full">
        {name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
