export const runtime = "edge";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}
