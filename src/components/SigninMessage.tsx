import Link from "@mui/material/Link";
import { DOCS } from "@/constant";

export function SigninMessage() {
  return (
    <>
      <Link href="/api/auth/signin">サインイン</Link>してください（
      <Link href={`${DOCS}/signin.md`} target="_blank">
        マニュアル
      </Link>
      ）
    </>
  );
}
