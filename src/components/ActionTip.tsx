import { Tooltip } from "@heroui/react";
import { cloneElement, type ReactElement } from "react";

type TipChildProps = {
  className?: string;
};

/**
 * HeroUI tooltips only open when the trigger consumes the focusable props.
 * The render function merges those props onto the real control so the row stays one flex line.
 */
export function ActionTip({
  label,
  disabled = false,
  children,
}: {
  label: string | null;
  disabled?: boolean;
  children: ReactElement<TipChildProps>;
}) {
  if (!label) return children;
  return (
    <Tooltip delay={400} isDisabled={disabled}>
      <Tooltip.Trigger
        render={(props) => {
          const { role: _role, children: _nested, className, ...rest } = props;
          return cloneElement(children, {
            ...rest,
            className: [className, children.props.className].filter(Boolean).join(" "),
          });
        }}
      />
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
