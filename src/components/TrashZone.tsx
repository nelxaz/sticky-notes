type TrashZoneProps = {
  isActive: boolean;
  isTargeted: boolean;
};

export function TrashZone({ isActive, isTargeted }: TrashZoneProps) {
  return (
    <div
      aria-hidden="true"
      className={`trash-zone${isActive ? " trash-zone--active" : ""}${
        isTargeted ? " trash-zone--targeted" : ""
      }`}
      data-trash-zone="true"
    >
      <div className="trash-zone__icon">
        <span className="trash-zone__lid" />
        <span className="trash-zone__body" />
      </div>
      <p className="trash-zone__label">Trash</p>
    </div>
  );
}
