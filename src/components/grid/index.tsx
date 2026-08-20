import clsx from "clsx";

export default function Grid(props: React.ComponentProps<"ul">) {
  return (
    <ul
      {...props}
      className={clsx("grid grid-flow-row gap-4", props.className)}
    >
      {props.children}
    </ul>
  );
}

function GridItem(props: React.ComponentProps<"li">) {
  return (
    <li
      {...props}
      className={clsx(
        "relative aspect-square w-full min-w-0 transition-opacity",
        props.className
      )}
    >
      {props.children}
    </li>
  );
}

Grid.Item = GridItem;
