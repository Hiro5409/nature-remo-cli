import { invalidArgument } from "../errors.ts";

type Selectable = {
  id: string;
};

type ResourceNames<T> = {
  name: (resource: T) => string;
  singular: string;
};

export function selectResource<T extends Selectable>(
  resources: T[],
  selector: string | undefined,
  names: ResourceNames<T>,
): T {
  if (!selector) {
    const onlyResource = resources[0];
    if (onlyResource && resources.length === 1) return onlyResource;
    if (resources.length === 0) throw invalidArgument(`No ${names.singular} is configured.`);
    throw invalidArgument(
      `Multiple ${names.singular}s found. Provide an ID or case-insensitive exact name.`,
    );
  }

  const normalized = selector.toLowerCase();
  const matches = resources.filter(
    (resource) => resource.id === selector || names.name(resource).toLowerCase() === normalized,
  );
  const onlyMatch = matches[0];
  if (onlyMatch && matches.length === 1) return onlyMatch;
  if (matches.length === 0) {
    throw invalidArgument(`${names.singular} not found: ${selector}`);
  }
  throw invalidArgument(`Multiple ${names.singular}s are named: ${selector}`);
}
