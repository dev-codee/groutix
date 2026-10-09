import Image from "next/image";

export default function GoogleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <Image src="/google-logo.svg" alt="Google" width={24} height={24} className={className} />;
}
