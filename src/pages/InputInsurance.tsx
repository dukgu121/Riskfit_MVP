/**
 * Wizard step 5/7 — register every insurance policy the user holds.
 *
 * UX shape:
 *   - Empty list  → centered illustration + "보험 추가하기" CTA.
 *   - Non-empty   → vertical list of compact cards, each tappable to
 *                   open an edit dialog. A ghost "+ 보험 더 추가하기"
 *                   sits below the list.
 *   - Skip path   → users *can* proceed with zero policies (보장 분석은
 *                   여전히 가능 — 다만 비교 기준이 표준값 한정이라 안내).
 *
 * Persistence: `riskfit.insurances` — `Insurance[]`. Each insurance gets
 * a UUID at creation time (via `crypto.randomUUID()`); ids are stable
 * across edits so list animations don't flicker.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

import { InsuranceCard } from "../components/insurance/InsuranceCard";
import { InsuranceEmptyState } from "../components/insurance/InsuranceEmptyState";
import { InsuranceForm } from "../components/insurance/InsuranceForm";
import { StepFooter } from "../components/wizard/StepFooter";
import { StepHeader } from "../components/wizard/StepHeader";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { durations, easeOutExpo } from "../lib/motion";
import { read, write } from "../lib/storage";
import type { Insurance } from "../types";

const STORAGE_KEY = "riskfit.insurances";

interface EditorState {
  mode: "add" | "edit";
  insurance: Insurance | null;
}

export function InputInsurance() {
  const navigate = useNavigate();

  const [insurances, setInsurances] = useState<Insurance[]>(() =>
    read<Insurance[]>(STORAGE_KEY, []),
  );
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<Insurance | null>(null);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      write(STORAGE_KEY, insurances);
    }, 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [insurances]);

  const openAdd = useCallback(() => {
    setEditor({ mode: "add", insurance: null });
  }, []);

  const openEdit = useCallback((insurance: Insurance) => {
    setEditor({ mode: "edit", insurance });
  }, []);

  const closeEditor = useCallback(() => {
    setEditor(null);
  }, []);

  const handleSubmit = useCallback(
    (insurance: Insurance) => {
      setInsurances((prev) => {
        const idx = prev.findIndex((p) => p.id === insurance.id);
        if (idx === -1) return [...prev, insurance];
        const next = prev.slice();
        next[idx] = insurance;
        return next;
      });
      setEditor(null);
    },
    [],
  );

  const handleDelete = useCallback((insurance: Insurance) => {
    setInsurances((prev) => prev.filter((p) => p.id !== insurance.id));
    setDeleting(null);
  }, []);

  function handleNext() {
    write(STORAGE_KEY, insurances);
    navigate("/analyzing");
  }

  const hasInsurances = insurances.length > 0;

  return (
    <section className="flex-1 flex flex-col">
      <main
        aria-labelledby="step-insurance-heading"
        className="mx-auto w-full max-w-[480px] px-5 pb-40"
      >
        <StepHeader step={5} onBack={() => navigate("/input/family")} />

        <div className="mt-6">
          <h2
            id="step-insurance-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-neutral-900"
          >
            가입 보험
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            없으면 비워둬도 괜찮아요.
          </p>
        </div>

        <div className="mt-8">
          {!hasInsurances ? (
            <InsuranceEmptyState onAdd={openAdd} />
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {insurances.map((insurance) => (
                  <motion.div
                    key={insurance.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: durations.base, ease: easeOutExpo }}
                  >
                    <InsuranceCard
                      insurance={insurance}
                      onEdit={() => openEdit(insurance)}
                      onDelete={() => setDeleting(insurance)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="ghost"
                onClick={openAdd}
                className="mt-2 h-14 w-full justify-center border border-dashed border-neutral-300 text-neutral-700"
              >
                <Plus className="h-5 w-5" aria-hidden />
                보험 추가
              </Button>
            </div>
          )}
        </div>

        {hasInsurances ? (
          <p className="mt-6 text-xs leading-relaxed text-neutral-500">
            로그인한 경우 입력 정보는 Firebase에 저장됩니다. 보험상품 추천이 아닙니다.
          </p>
        ) : null}
      </main>

      <StepFooter
        canContinue
        helperText={
          !hasInsurances ? "비워둬도 다음으로 넘어갈 수 있어요." : undefined
        }
        nextLabel="분석 시작"
        onBack={() => navigate("/input/family")}
        onNext={handleNext}
      />

      {/* ----------------------------------------------- 추가·수정 모달 ---- */}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "edit" ? "보험 수정" : "보험 추가"}
            </DialogTitle>
            <DialogDescription>
              보장 유형과 금액만 필수예요. 상품명·보험사는 비워둬도 괜찮아요.
            </DialogDescription>
          </DialogHeader>

          {editor !== null ? (
            <InsuranceForm
              key={`${editor.mode}:${editor.insurance?.id ?? "new"}`}
              initial={editor.insurance}
              onSubmit={handleSubmit}
              onCancel={closeEditor}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------- 삭제 확인 모달 ---- */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>보험을 삭제합니다</DialogTitle>
            <DialogDescription>
              입력한 보장 정보가 사라져요. 다시 등록할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleting(null)}
              className="h-12 text-base text-neutral-700"
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleting && handleDelete(deleting)}
              className="h-12 text-base"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default InputInsurance;
