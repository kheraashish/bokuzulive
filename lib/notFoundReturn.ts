// Where a wrong URL sends the visitor once the 404 is over.
//
// Almost every 404 is a typo or a crawler guess, and the top of the site is the right place for
// those. But /nobody-comes-here is a link we placed ourselves, inside the WrongLetter section, so a
// reader who takes us up on it must come back to the paragraph they were reading — not the top of a
// page they already scrolled past. Both the film and the no-film countdown resolve through here, or
// the fallback path would quietly dump them somewhere else.
const RETURN_TO: Record<string, string> = {
  "/nobody-comes-here": "/#wrong-letter",
};

function normalise(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.toLowerCase().replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function returnDestination(pathname: string): string {
  return RETURN_TO[normalise(pathname)] ?? "/";
}
