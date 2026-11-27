import { Button } from "@/components/ui/button";
import { startDemo } from "@/lib/actions/auth";

/** Reset the demo session to the example plan or to a blank slate. */
export function DemoControls() {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={startDemo.bind(null, "example")}>
        <Button type="submit" variant="outline">
          Reset to the example plan
        </Button>
      </form>
      <form action={startDemo.bind(null, "blank")}>
        <Button type="submit" variant="outline">
          Start over with a blank plan
        </Button>
      </form>
    </div>
  );
}
