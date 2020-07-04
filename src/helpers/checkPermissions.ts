import { HttpError } from "../http-error";
import { Permission } from "../Permission";
import { IUser } from "../models/user";

export default (
  user: IUser,
  permissions: Permission[] | Permission,
  owner?: number
) => {
  const p = Array.isArray(permissions)
    ? permissions
    : ([permissions] as Permission[]);

  if (user.admin) {
    return true;
  }

  if (owner && user._id === owner) {
    return true;
  }

  for (let permission of p) {
    if (!user.permissions.includes(permission)) {
      throw new HttpError(401, "Insufficient permissions.");
    }
  }

  return true;
};
