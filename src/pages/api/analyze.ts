import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  
  // TODO: Replace this with actual API call to analysis service
  // For now, return mock data
  // const results = {
  //   output: {
  //     mean_corrected_age: 12.345,
  //     within_variance: 0.123,
  //     between_variance: 0.456,
  //     known_age: 12.5,
  //     known_age_lower_90: 10.2,
  //     known_age_upper_90: 14.8,
  //     known_age_lower_95: 9.5,
  //     known_age_upper_95: 15.5,
  //     known_age_lower_99: 8.0,
  //     known_age_upper_99: 17.0,
  //   },
  //   images: {
  //     distribution: null, // Base64 image would go here
  //     formation: null,    // Base64 image would go here
  //   }
  // };
  
  // // Simulate API delay
  // await new Promise(resolve => setTimeout(resolve, 1000));

  // let url = `http://localhost:8000/tada?dc=2&dm1=3&dm2=2&UI1=&UI2=&LI1=&LI2=&C=&P3=&P4=&M1=&M2=&M3=`;
  let url = `http://localhost:8000/tada?`;
  url += `dc=${data.scores.dc}&`;
  url += `dm1=${data.scores.dc}&`;
  url += `dm2=${data.scores.dc}&`;
  url += `UI1=${data.scores.dc}&`;
  url += `UI2=${data.scores.dc}&`;
  url += `LI1=${data.scores.dc}&`;
  url += `LI2=${data.scores.dc}&`;
  url += `C=${data.scores.dc}&`;
  url += `P3=${data.scores.dc}&`;
  url += `P4=${data.scores.dc}&`;
  url += `M1=${data.scores.dc}&`;
  url += `M2=${data.scores.dc}&`;
  url += `M3=${data.scores.dc}`;

  url = 'http://localhost:8000/tada?dc=&dm1=&dm2=&UI1=9&UI2=9&LI1=&LI2=&C=7&P3=5&P4=5&M1=9&M2=&M3=';
  console.log(url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    //body: JSON.stringify(input_data)
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  const results = await response.json();
  
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};