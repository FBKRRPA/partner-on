import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-black text-[#01916D]">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mt-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-3 bg-[#01916D] hover:bg-[#006449] text-white font-bold rounded-xl shadow-md transition-all text-sm"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
