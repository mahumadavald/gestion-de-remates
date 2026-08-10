'use client'
import { useEffect } from "react";

export const dynamic = 'force-dynamic';

export default function ParticiparSlugRedirect({ params }) {
  useEffect(() => {
    const slug = params?.slug || "";
    window.location.replace(`/participar${slug ? `?casa=${slug}` : ""}`);
  }, [params]);

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f4f4f2",color:"#6b7280",fontSize:".9rem"}}>
      Redirigiendo...
    </div>
  );
}
