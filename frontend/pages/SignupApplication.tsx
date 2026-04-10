import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { authService } from "../services/authService";
import { User } from "../types/interface";

export default function SignupApplication() {
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const dept = (location.pathname.includes("dis") ? "DIS" : "DCS") as "DIS" | "DCS";

  const validationSchema = Yup.object({
    name: Yup.string().required("Full name is required"),
    studentId: Yup.string()
      .matches(/^202\d{6}$/, "Institutional ID must start with 202 and be 9 digits")
      .required("Institutional ID is required"),
    email: Yup.string()
      .email("Invalid email")
      .matches(/@s.msumain.edu.ph$/, "Must be an @s.msumain.edu.ph email")
      .required("Institutional email is required"),
    yearLevel: Yup.number().oneOf([1, 2, 3, 4], "Please select a year level").required("Required"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Required"),
  });

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 font-poppins">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Application Sent</h1>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            Your application for the <span className="font-bold text-[#2f318d]">{dept}</span> department is now pending. Please wait for admin approval to log in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full font-poppins items-center justify-center p-4 bg-[radial-gradient(at_0%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(at_100%_100%,rgba(99,102,241,0.10),transparent_65%)] bg-slate-50">
      <Formik
        initialValues={{ 
          name: "", 
          studentId: "", 
          password: "", 
          email: "", 
          yearLevel: "" as unknown as number, 
          department: dept 
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus(null);
          try {
            await authService.submitApplication(values as Partial<User>);
            setIsSuccess(true);
          } catch (err: any) {
            setStatus(err.response?.data?.error || "Submission failed. Please try again.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleBlur, isSubmitting, status, errors, touched }) => (
          <Form className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-500 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10">
            <div className="flex justify-center mt-4">
              <img src="/cics.png" alt="CICS Logo" className="h-20 w-20 object-contain" />
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
                MSU CICS Election Day
              </h2>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                Voter Registration
              </h1>
              <p className="text-sm text-slate-500 mt-2">Apply for a voter account for {dept}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div className="space-y-2 mb-5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-12 w-full border px-5 text-sm rounded-xl transition-all duration-200 outline-none font-medium ${errors.name && touched.name ? "border-red-300 bg-red-50/30 ring-4 ring-red-50" : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"}`}
                />
                <ErrorMessage name="name" component="p" className="text-[10px] text-red-500 font-medium ml-1" />
              </div>

              <div className="space-y-2 mb-5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Institutional ID</label>
                <input
                  name="studentId"
                  type="text"
                  placeholder="202XXXXXX"
                  value={values.studentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-12 w-full border px-5 text-sm rounded-xl transition-all duration-200 outline-none font-medium ${errors.studentId && touched.studentId ? "border-red-300 bg-red-50/30 ring-4 ring-red-50" : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"}`}
                />
                <ErrorMessage name="studentId" component="p" className="text-[10px] text-red-500 font-medium ml-1" />
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Institutional Email</label>
              <input
                name="email"
                type="email"
                placeholder="username@s.msumain.edu.ph"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`h-12 w-full border px-5 text-sm rounded-xl transition-all duration-200 outline-none font-medium ${errors.email && touched.email ? "border-red-300 bg-red-50/30 ring-4 ring-red-50" : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"}`}
              />
              <ErrorMessage name="email" component="p" className="text-[10px] text-red-500 font-medium ml-1" />
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <div className="space-y-2 mb-5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Year Level</label>
                <select
                  name="yearLevel"
                  value={values.yearLevel}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 w-full border px-4 text-sm rounded-xl border-slate-200 bg-slate-50/50 outline-none font-medium focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50 appearance-none"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <ErrorMessage name="yearLevel" component="p" className="text-[10px] text-red-500 font-medium ml-1" />
              </div>

              <div className="space-y-2 mb-5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Department</label>
                <input
                  readOnly
                  value={dept}
                  className="h-12 w-full border px-5 text-sm rounded-xl border-slate-100 bg-slate-100 text-[#2f318d] font-bold outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-12 w-full border px-5 pr-12 text-sm rounded-xl transition-all duration-200 outline-none font-medium ${errors.password && touched.password ? "border-red-300 bg-red-50/30 ring-4 ring-red-50" : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2f318d] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ErrorMessage name="password" component="p" className="text-[10px] text-red-500 font-medium ml-1" />
            </div>

            {status && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                <p className="text-xs font-medium text-red-600 text-center">{status}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-2xl bg-[#2f318d] text-white font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-[#26287a] hover:translate-y-0.5 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}