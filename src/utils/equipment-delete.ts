import { feedback } from "@/services/feedback";
import { isConflictError } from "@/services/http";
import { getApiErrorMessage } from "@/utils/api-error";

type DeleteFn = (args: { id: string; cascade?: boolean }) => Promise<unknown>;

/**
 * Confirma exclusão de equipamento. Se houver inspeções (409),
 * oferece cascade com confirmação explícita.
 */
export async function confirmAndDeleteEquipment(options: {
  id: string;
  name: string;
  deleteFn: DeleteFn;
}): Promise<"deleted" | "cancelled"> {
  const first = await feedback.choose(
    "Excluir equipamento",
    `Deseja remover ${options.name} e o QR Code associado?`,
    [
      { text: "Cancelar", value: "cancel", style: "cancel" },
      { text: "Excluir", value: "delete", style: "destructive" },
    ]
  );

  if (first !== "delete") return "cancelled";

  try {
    await options.deleteFn({ id: options.id });
    feedback.toast.success("Equipamento removido.");
    return "deleted";
  } catch (error) {
    if (!isConflictError(error) && !(error instanceof Error && /inspeç/i.test(error.message))) {
      feedback.toast.error(getApiErrorMessage(error, "Não foi possível remover o equipamento."));
      return "cancelled";
    }

    const cascade = await feedback.choose(
      "Equipamento com inspeções",
      `${options.name} possui inspeções registradas. Excluir mesmo assim remove o equipamento, o QR Code e todo o histórico de inspeções.`,
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir tudo", value: "cascade", style: "destructive" },
      ]
    );

    if (cascade !== "cascade") return "cancelled";

    try {
      await options.deleteFn({ id: options.id, cascade: true });
      feedback.toast.success("Equipamento e histórico removidos.");
      return "deleted";
    } catch (cascadeError) {
      feedback.toast.error(
        getApiErrorMessage(cascadeError, "Não foi possível remover o equipamento.")
      );
      return "cancelled";
    }
  }
}
