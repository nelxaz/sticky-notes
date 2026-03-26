type TrashZoneProps = {
  isActive: boolean;
  isPending: boolean;
  isTargeted: boolean;
};

export function TrashZone({ isActive, isPending, isTargeted }: TrashZoneProps) {
  return (
    <div
      aria-hidden="true"
      className={`trash-zone${isActive ? " trash-zone--active" : ""}${
        isTargeted ? " trash-zone--targeted" : ""
      }${isPending ? " trash-zone--pending" : ""}`}
      data-trash-zone="true"
    >
      <div className="trash-zone__icon">
        <span className="trash-zone__lid" />
        <span className="trash-zone__body" />
      </div>
      <p className="trash-zone__label">{isPending ? "Deleting..." : "Trash"}</p>
    </div>
  );
}
