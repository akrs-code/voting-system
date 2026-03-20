import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    studentId: Yup.string()
      .matches(/^202\d{6}$/, "Institutional ID must start with 202 and be 9 digits")
      .required("Institutional ID is required"),
    password: Yup.string().required("Password is required"),
  });

  return (
    <div className="flex min-h-screen w-full p-4 font-poppins md:p-6 bg-[radial-gradient(at_0%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(at_100%_0%,rgba(165,180,252,0.12),transparent_60%),radial-gradient(at_0%_100%,rgba(199,210,254,0.12),transparent_60%),radial-gradient(at_100%_100%,rgba(99,102,241,0.10),transparent_65%)]">
      <div className="flex w-full flex-col items-center justify-center">
        <div className="w-full max-w-136 px-6 md:px-10">
          <div className="mb-10 flex flex-col items-center">
            <img
              src="/cics.png"
              alt="MSU Logo"
              width={96}
              height={96}
              className="object-contain mb-3"
            />
            <h2 className="text-[1rem] font-bold tracking-[0.1rem] text-[#2f318d] uppercase">
              MSU CICS Election Day
            </h2>
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-[2.6rem] font-bold tracking-tight text-slate-800 leading-tight">
              Login your credentials
            </h1>
            <p className="text-[1rem] mt-1 font-medium text-slate-400">
              Sign in with your institutional credentials to cast your vote.
            </p>
          </div>

          <Formik
            initialValues={{ studentId: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                const loggedInUser = await login(values);
                if (loggedInUser.user.role === "admin") {
                  navigate("/dashboard/admin");
                } else if (loggedInUser.user.role === "voter") {
                  navigate("/dashboard/voter");
                }
              } catch (err: any) {
                const errorMsg = err.response?.data?.message || "Invalid credentials.";
                setStatus(errorMsg);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, handleChange, handleBlur, isSubmitting, errors, status }) => (
              <Form className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="studentId" className="text-[1rem] font-bold text-[#1e293b]">
                    Institutional ID
                  </Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="202******"
                    value={values.studentId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`h-14 w-full border-[#94a3b8]/80 px-5 text-[1rem] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2f318d] placeholder:text-slate-300 ${errors.studentId ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                  />
                  <ErrorMessage name="studentId" component="p" className="text-sm text-red-500 font-medium" />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-[1rem] font-bold text-[#1e293b]">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`h-14 w-full border-[#94a3b8]/80 px-5 text-[1rem] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2f318d] placeholder:text-slate-300 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                  />
                  <ErrorMessage name="password" component="p" className="text-sm text-red-500 font-medium" />
                </div>

                {status && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-500 text-center">{status}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-xl bg-[#2f318d] text-[1.1rem] font-bold text-white shadow-[0_12px_24px_-8px_rgba(47,49,141,0.5)] transition-all hover:bg-[#26287a] active:scale-[0.99] mt-4 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Get Started"}
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}