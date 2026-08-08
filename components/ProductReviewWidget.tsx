"use client";

import React, { useEffect } from "react";

export default function ProductReviewWidget({ className = "" }: { className?: string }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initWidget = () => {
        (window as any).__productReviewCallbackQueue =
          (window as any).__productReviewCallbackQueue || [];
        (window as any).__productReviewCallbackQueue.push(function (ProductReview: any) {
          try {
            ProductReview.use("rich-rating-badge", {
              container: "#pr-rich-rating-badge-widget",
              identificationDetails: {
                type: "single",
                strategy: "from-internal-entry-id",
                identifier: "89f16ee1-4bac-5f77-b108-4f880e788290",
              },
            });
          } catch (err) {
            console.error("ProductReview widget error:", err);
          }
        });
      };

      initWidget();
    }
  }, []);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div id="pr-rich-rating-badge-widget">&nbsp;</div>
    </div>
  );
}
