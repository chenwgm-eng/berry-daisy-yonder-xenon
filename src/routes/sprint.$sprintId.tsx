import { createFileRoute } from "@tanstack/react-router";
import { WarRoom } from "@/components/war-room";

export const Route = createFileRoute("/sprint/$sprintId")({
  component: SprintPage,
});

function SprintPage() {
  const { sprintId } = Route.useParams();
  return <WarRoom sprintId={sprintId} />;
}
