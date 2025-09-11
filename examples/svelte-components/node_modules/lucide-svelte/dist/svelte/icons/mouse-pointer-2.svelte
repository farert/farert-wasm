<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m4 4 7.07 17 2.51-7.39L21 11.07z" }]];
</script>

<Icon name="mouse-pointer-2" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
