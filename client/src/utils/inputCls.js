/**
 * @deprecated inputCls is deprecated as of Phase 4.
 * Use the Input, Textarea, or Select components from src/components/forms/ instead:
 *
 *   import Input from "../../components/forms/Input";
 *   import Textarea from "../../components/forms/Textarea";
 *   import Select from "../../components/forms/Select";
 *
 * inputCls is kept here temporarily for backward compatibility
 * while remaining pages are being migrated.
 */
export const inputCls = (err) =>
  `cc-input-field ${err ? "cc-input-field--error" : ""}`;
