import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallback?: string;
  theme?: "dark" | "light";
}

export function BackButton({ fallback = "/home", theme = "light" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        .back-btn-wrapper {
          display: inline-block;
          margin-bottom: 28px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px 8px 12px;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          line-height: 1;
          letter-spacing: 0.01em;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .back-btn svg {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .back-btn:hover svg {
          transform: translateX(-2px);
        }

        /* Dark variant: glass/frosted — for dark hero sections like MyIssues */
        .back-btn-dark {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.7);
        }

        .back-btn-dark:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.28);
          color: rgba(255, 255, 255, 0.95);
          transform: translateX(-2px);
        }

        .back-btn-dark:active {
          transform: translateX(-1px) scale(0.98);
        }

        /* Light variant: clean pill — for white/gray pages like Index, Profile etc. */
        .back-btn-light {
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .back-btn-light:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
        }

        .back-btn-light:active {
          transform: translateX(-1px) scale(0.98);
        }
      `}</style>

      {/* Wrapper gives consistent gap between the button and whatever comes after it */}
      <div className="back-btn-wrapper">
        <button
          className={`back-btn ${theme === "dark" ? "back-btn-dark" : "back-btn-light"}`}
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </>
  );
}